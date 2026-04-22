#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple


OWNER = "AntXinyuan"
REPO = "antxinyuan.github.io"
DISCUSSION_NUMBER = 5
DISCUSSION_URL = f"https://github.com/{OWNER}/{REPO}/discussions/{DISCUSSION_NUMBER}"
GRAPHQL_API_URL = "https://api.github.com/graphql"
COMMENT_HEADER = "### Academic Snake Score"
DEFAULT_PLAYER_NAME = "Anonymous Reviewer"

MACHINE_BLOCK_RE = re.compile(r"<!--\s*academic-snake:v2\s*(\{.*?\})\s*-->", re.DOTALL)
PLAYER_RE = re.compile(r"^\s*[-*]\s*Player:\s*(.+?)\s*$", re.MULTILINE)
SCORE_RE = re.compile(r"^\s*[-*]\s*Score:\s*(\d+)\s*$", re.MULTILINE)
LENGTH_RE = re.compile(r"^\s*[-*]\s*Doctoral hats:\s*(\d+)\s*$", re.MULTILINE)
BEST_COMBO_RE = re.compile(r"^\s*[-*]\s*Best combo:\s*(\d+)\s*$", re.MULTILINE)
DATE_RE = re.compile(r"^\s*[-*]\s*Date:\s*(.+?)\s*$", re.MULTILINE)

GRAPHQL_QUERY = """
query($owner: String!, $repo: String!, $number: Int!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    discussion(number: $number) {
      url
      comments(first: 100, after: $cursor) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          body
          createdAt
          url
          author {
            __typename
            login
          }
        }
      }
    }
  }
}
""".strip()


def stable_json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def compute_public_md5(payload: Dict[str, Any]) -> str:
    return hashlib.md5(stable_json_dumps(payload).encode("utf-8")).hexdigest()


def clean_player_name(value: Any) -> str:
    name = re.sub(r"\s+", " ", str(value or DEFAULT_PLAYER_NAME)).strip()
    name = name[:18].strip()
    return name or DEFAULT_PLAYER_NAME


def parse_datetime_value(value: str) -> Optional[datetime]:
    if not value:
        return None

    normalized = value.strip()
    if not normalized:
        return None

    try:
        return datetime.fromisoformat(normalized.replace("Z", "+00:00"))
    except ValueError:
        pass

    for fmt in ("%Y/%m/%d %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(normalized, fmt)
        except ValueError:
            continue

    return None


def normalize_achieved_at(value: str) -> str:
    parsed = parse_datetime_value(value)
    if parsed is None:
        return value.strip()

    if parsed.tzinfo is not None:
        return parsed.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

    return parsed.isoformat(timespec="seconds")


def comparable_time(achieved_at: str, fallback: str) -> datetime:
    for candidate in (achieved_at, fallback):
        parsed = parse_datetime_value(candidate)
        if parsed is None:
            continue
        if parsed.tzinfo is not None:
            return parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    return datetime.max


def excerpt_body(body: str, limit: int = 160) -> str:
    compact = re.sub(r"\s+", " ", body).strip()
    return compact[:limit]


def parse_positive_int(value: Any, field_name: str) -> int:
    if isinstance(value, bool):
        raise ValueError(f"{field_name} must be an integer")

    try:
        parsed = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{field_name} must be an integer") from error

    if parsed < 0:
        raise ValueError(f"{field_name} must be non-negative")
    return parsed


def build_machine_checksum_base(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "bestCombo": parse_positive_int(payload.get("bestCombo"), "bestCombo"),
        "length": parse_positive_int(payload.get("length"), "length"),
        "playedAt": str(payload.get("playedAt") or "").strip(),
        "player": clean_player_name(payload.get("player")),
        "score": parse_positive_int(payload.get("score"), "score")
    }


def inspect_machine_payload(body: str) -> Dict[str, Any]:
    match = MACHINE_BLOCK_RE.search(body)
    if not match:
        return {
            "status": "missing"
        }

    try:
        payload = json.loads(match.group(1))
    except json.JSONDecodeError as error:
        return {
            "status": "invalid",
            "error": f"invalid_machine_json:{error.msg}",
            "raw_machine_block": match.group(1)
        }

    details: Dict[str, Any] = {
        "status": "invalid",
        "raw_payload": payload
    }

    required_fields = {"player", "score", "length", "bestCombo", "playedAt", "md5"}
    missing_fields = sorted(required_fields - set(payload.keys()))
    if missing_fields:
        details["error"] = f"missing_machine_fields:{','.join(missing_fields)}"
        return details

    try:
        checksum_base = build_machine_checksum_base(payload)
    except ValueError as error:
        details["error"] = str(error)
        return details

    expected_md5 = compute_public_md5(checksum_base)
    provided_md5 = str(payload.get("md5") or "").strip().lower()

    details.update({
        "checksum_base": checksum_base,
        "expected_md5": expected_md5,
        "provided_md5": provided_md5
    })

    if provided_md5 != expected_md5:
        details["error"] = "checksum_mismatch"
        return details

    details["status"] = "valid"
    details["error"] = None
    return details


def parse_machine_payload(body: str) -> Tuple[Optional[Dict[str, Any]], Optional[str], str]:
    details = inspect_machine_payload(body)
    if details["status"] == "missing":
        return None, None, "missing"
    if details["status"] != "valid":
        return None, details.get("error") or "invalid_machine_payload", "invalid"

    checksum_base = details["checksum_base"]

    return {
        "player_name": checksum_base["player"],
        "score": checksum_base["score"],
        "length": checksum_base["length"],
        "best_combo": checksum_base["bestCombo"],
        "achieved_at": normalize_achieved_at(checksum_base["playedAt"]),
        "checksum_status": "valid"
    }, None, "valid"


def extract_match(pattern: re.Pattern, body: str, label: str) -> str:
    match = pattern.search(body)
    if not match:
        raise ValueError(f"missing_{label}")
    return match.group(1).strip()


def parse_legacy_payload(body: str) -> Dict[str, Any]:
    return {
        "player_name": clean_player_name(extract_match(PLAYER_RE, body, "player")),
        "score": parse_positive_int(extract_match(SCORE_RE, body, "score"), "score"),
        "length": parse_positive_int(extract_match(LENGTH_RE, body, "length"), "length"),
        "best_combo": parse_positive_int(extract_match(BEST_COMBO_RE, body, "best_combo"), "bestCombo"),
        "achieved_at": normalize_achieved_at(extract_match(DATE_RE, body, "date")),
        "checksum_status": "missing"
    }


def build_rejected_entry(comment: Dict[str, Any], reason: str, checksum_status: str) -> Dict[str, Any]:
    author = comment.get("author") or {}
    return {
        "github_login": str(author.get("login") or "").strip(),
        "comment_url": str(comment.get("url") or DISCUSSION_URL),
        "comment_created_at": str(comment.get("createdAt") or ""),
        "checksum_status": checksum_status,
        "reason": reason,
        "body_excerpt": excerpt_body(str(comment.get("body") or ""))
    }


def build_suggested_machine_payload(parsed_entry: Dict[str, Any]) -> Dict[str, Any]:
    checksum_base = {
        "bestCombo": parsed_entry["best_combo"],
        "length": parsed_entry["length"],
        "playedAt": parsed_entry["achieved_at"],
        "player": parsed_entry["player_name"],
        "score": parsed_entry["score"]
    }
    return {
        **checksum_base,
        "md5": compute_public_md5(checksum_base)
    }


def parse_comment(comment: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    body = str(comment.get("body") or "")
    if COMMENT_HEADER not in body:
        return None, None

    author = comment.get("author") or {}
    github_login = str(author.get("login") or "").strip()
    if not github_login:
        return None, build_rejected_entry(comment, "missing_github_login", "invalid")

    machine_payload, machine_error, checksum_status = parse_machine_payload(body)
    if machine_payload is not None:
        parsed = machine_payload
    elif checksum_status == "invalid":
        return None, build_rejected_entry(comment, machine_error or "invalid_machine_payload", "invalid")
    else:
        try:
            parsed = parse_legacy_payload(body)
        except ValueError as error:
            return None, build_rejected_entry(comment, str(error), "missing")

    return {
        "github_login": github_login,
        "player_name": parsed["player_name"],
        "score": parsed["score"],
        "length": parsed["length"],
        "best_combo": parsed["best_combo"],
        "achieved_at": parsed["achieved_at"],
        "comment_created_at": str(comment.get("createdAt") or ""),
        "comment_url": str(comment.get("url") or DISCUSSION_URL),
        "checksum_status": parsed["checksum_status"]
    }, None


def extract_known_comment_urls(payload: Optional[Dict[str, Any]]) -> Set[str]:
    urls: Set[str] = set()
    if not payload:
        return urls

    for section in ("leaderboard", "rejected_entries"):
        for entry in payload.get(section) or []:
            url = str(entry.get("comment_url") or "").strip()
            if url:
                urls.add(url)
    return urls


def build_comment_diagnostic(comment: Dict[str, Any]) -> Dict[str, Any]:
    body = str(comment.get("body") or "")
    machine_details = inspect_machine_payload(body)
    parsed_entry, rejected_entry = parse_comment(comment)

    diagnostic: Dict[str, Any] = {
        "github_login": str((comment.get("author") or {}).get("login") or "").strip(),
        "comment_url": str(comment.get("url") or DISCUSSION_URL),
        "comment_created_at": str(comment.get("createdAt") or ""),
        "body": body
    }

    if parsed_entry is not None:
        diagnostic["parse_result"] = "accepted"
        diagnostic["parsed_entry"] = parsed_entry
        diagnostic["suggested_machine_payload"] = build_suggested_machine_payload(parsed_entry)
    else:
        diagnostic["parse_result"] = "rejected"

    if rejected_entry is not None:
        diagnostic["rejected_entry"] = rejected_entry

    if machine_details["status"] != "missing":
        diagnostic["machine_payload_details"] = machine_details
        checksum_base = machine_details.get("checksum_base")
        expected_md5 = machine_details.get("expected_md5")
        if checksum_base and expected_md5:
            diagnostic["correct_machine_payload"] = {
                **checksum_base,
                "md5": expected_md5
            }

    return diagnostic


def build_new_score_comment_diagnostics(source_data: Dict[str, Any], existing_payload: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    known_comment_urls = extract_known_comment_urls(existing_payload)
    diagnostics: List[Dict[str, Any]] = []

    for comment in source_data.get("comments") or []:
        body = str(comment.get("body") or "")
        comment_url = str(comment.get("url") or DISCUSSION_URL)
        if COMMENT_HEADER not in body:
            continue
        if comment_url in known_comment_urls:
            continue
        diagnostics.append(build_comment_diagnostic(comment))

    return diagnostics


def print_new_score_comment_diagnostics(diagnostics: List[Dict[str, Any]]) -> None:
    print(json.dumps({
        "new_score_comments_detected": len(diagnostics)
    }, ensure_ascii=False))

    if not diagnostics:
        return

    print("=== New Academic Snake score comments ===")
    for index, diagnostic in enumerate(diagnostics, start=1):
        print(f"--- score_comment_{index} ---")
        print(json.dumps(diagnostic, ensure_ascii=False, indent=2))


def ranking_sort_key(entry: Dict[str, Any]) -> Tuple[Any, ...]:
    return (
        -entry["score"],
        -entry["length"],
        -entry["best_combo"],
        comparable_time(entry.get("achieved_at", ""), entry.get("comment_created_at", "")),
        entry["github_login"].lower(),
        entry["player_name"].lower()
    )


def dedupe_entries(entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    best_by_login: Dict[str, Dict[str, Any]] = {}
    for entry in entries:
        key = entry["github_login"].lower()
        current = best_by_login.get(key)
        if current is None or ranking_sort_key(entry) < ranking_sort_key(current):
            best_by_login[key] = entry

    ranked_entries = sorted(best_by_login.values(), key=ranking_sort_key)
    return [
        {
            "rank": index + 1,
            **entry
        }
        for index, entry in enumerate(ranked_entries)
    ]


def graphql_request(token: str, query: str, variables: Dict[str, Any]) -> Dict[str, Any]:
    request_body = json.dumps({
        "query": query,
        "variables": variables
    }).encode("utf-8")
    request = urllib.request.Request(
        GRAPHQL_API_URL,
        data=request_body,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "academic-snake-leaderboard-script"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", "ignore")
        raise RuntimeError(f"GitHub GraphQL request failed: HTTP {error.code} {body}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"GitHub GraphQL request failed: {error}") from error

    if payload.get("errors"):
        raise RuntimeError(f"GitHub GraphQL errors: {payload['errors']}")

    data = payload.get("data") or {}
    return data


def fetch_discussion_comments(token: str) -> Dict[str, Any]:
    comments: List[Dict[str, Any]] = []
    cursor = None
    discussion_url = DISCUSSION_URL
    total_count = 0

    while True:
        data = graphql_request(token, GRAPHQL_QUERY, {
            "owner": OWNER,
            "repo": REPO,
            "number": DISCUSSION_NUMBER,
            "cursor": cursor
        })
        repository = data.get("repository") or {}
        discussion = repository.get("discussion")
        if not discussion:
            raise RuntimeError(f"Discussion #{DISCUSSION_NUMBER} not found")

        discussion_url = str(discussion.get("url") or DISCUSSION_URL)
        comment_connection = discussion.get("comments") or {}
        total_count = int(comment_connection.get("totalCount") or 0)
        comments.extend(comment_connection.get("nodes") or [])

        page_info = comment_connection.get("pageInfo") or {}
        if not page_info.get("hasNextPage"):
            break
        cursor = page_info.get("endCursor")

    return {
        "discussion_url": discussion_url,
        "comment_count": total_count,
        "comments": comments
    }


def load_fixture(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if isinstance(payload, list):
        comments = payload
        discussion_url = DISCUSSION_URL
        comment_count = len(comments)
    else:
        comments = payload.get("comments") or []
        discussion_url = str(payload.get("discussion_url") or DISCUSSION_URL)
        comment_count = int(payload.get("comment_count") or len(comments))

    return {
        "discussion_url": discussion_url,
        "comment_count": comment_count,
        "comments": comments
    }


def build_output(source_data: Dict[str, Any]) -> Dict[str, Any]:
    parsed_entries: List[Dict[str, Any]] = []
    rejected_entries: List[Dict[str, Any]] = []

    for comment in source_data["comments"]:
        parsed, rejected = parse_comment(comment)
        if parsed is not None:
            parsed_entries.append(parsed)
        if rejected is not None:
            rejected_entries.append(rejected)

    ranked_entries = dedupe_entries(parsed_entries)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "source": {
            "discussion_number": DISCUSSION_NUMBER,
            "discussion_url": source_data["discussion_url"],
            "comment_count": source_data["comment_count"]
        },
        "policy": {
            "dedupe": "github_login_keep_best_score",
            "sort": "score_desc,length_desc,best_combo_desc,achieved_at_asc",
            "checksum_mode": "public_md5_v2_with_legacy_fallback"
        },
        "leaderboard": ranked_entries,
        "rejected_entries": rejected_entries
    }


def write_output(path: str, payload: Dict[str, Any]) -> None:
    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def load_existing_output(path: str) -> Optional[Dict[str, Any]]:
    if not path or not os.path.exists(path):
        return None

    try:
        with open(path, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return None

    return payload if isinstance(payload, dict) else None


def extract_change_key(payload: Dict[str, Any]) -> Any:
    # Only leaderboard changes should trigger a write; timestamps like generated_at should not.
    return payload.get("leaderboard") or []


def should_write_output(existing_payload: Optional[Dict[str, Any]], next_payload: Dict[str, Any]) -> bool:
    if existing_payload is None:
        return True

    return extract_change_key(existing_payload) != extract_change_key(next_payload)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the Academic Snake remote leaderboard JSON.")
    parser.add_argument("--output", default="data/academic-snake-leaderboard.json", help="Output JSON path.")
    parser.add_argument("--fixture", help="Optional local fixture JSON for testing instead of GitHub API.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.fixture:
        source_data = load_fixture(args.fixture)
    else:
        token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
        if not token:
            print("GITHUB_TOKEN or GH_TOKEN is required unless --fixture is provided.", file=sys.stderr)
            return 1
        source_data = fetch_discussion_comments(token)

    existing_output = load_existing_output(args.output)
    new_comment_diagnostics = build_new_score_comment_diagnostics(source_data, existing_output)
    output = build_output(source_data)
    changed = should_write_output(existing_output, output)

    if changed:
        write_output(args.output, output)
    elif existing_output is not None:
        output = existing_output

    print_new_score_comment_diagnostics(new_comment_diagnostics)
    print(json.dumps({
        "output": args.output,
        "leaderboard_size": len(output["leaderboard"]),
        "rejected_entries": len(output["rejected_entries"]),
        "changed": changed
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
