import importlib.util
import json
import random
import re
import string
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "scripts" / "academic_snake_leaderboard.py"


def load_leaderboard_module():
    spec = importlib.util.spec_from_file_location("academic_snake_leaderboard", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


leaderboard = load_leaderboard_module()


def frontend_clean_player_name(value):
    normalized = re.sub(r"\s+", " ", str(value or leaderboard.DEFAULT_PLAYER_NAME)).strip()
    clipped = normalized[:18].strip()
    return clipped or leaderboard.DEFAULT_PLAYER_NAME


def frontend_stable_serialize(value):
    if isinstance(value, list):
        return "[" + ",".join(frontend_stable_serialize(item) for item in value) + "]"

    if isinstance(value, dict):
        return "{" + ",".join(
            f"{json.dumps(key, ensure_ascii=False)}:{frontend_stable_serialize(value[key])}"
            for key in sorted(value.keys())
        ) + "}"

    return json.dumps(value, ensure_ascii=False)


def _to_int32(value):
    value &= 0xFFFFFFFF
    return value if value < 0x80000000 else value - 0x100000000


def frontend_md5_hex(input_text):
    def add32(a, b):
        low = (a & 0xFFFF) + (b & 0xFFFF)
        high = ((a >> 16) & 0xFFFF) + ((b >> 16) & 0xFFFF) + (low >> 16)
        return _to_int32((high << 16) | (low & 0xFFFF))

    def rotate_left(value, shift):
        value &= 0xFFFFFFFF
        return _to_int32(((value << shift) | (value >> (32 - shift))) & 0xFFFFFFFF)

    def cmn(q, a, b, x, s, t):
        a = add32(add32(a, q), add32(x, t))
        return add32(rotate_left(a, s), b)

    def ff(a, b, c, d, x, s, t):
        return cmn((b & c) | ((~b) & d), a, b, x, s, t)

    def gg(a, b, c, d, x, s, t):
        return cmn((b & d) | (c & (~d)), a, b, x, s, t)

    def hh(a, b, c, d, x, s, t):
        return cmn(b ^ c ^ d, a, b, x, s, t)

    def ii(a, b, c, d, x, s, t):
        return cmn(c ^ (b | (~d)), a, b, x, s, t)

    def md5_cycle(state_words, block_words):
        a, b, c, d = state_words

        a = ff(a, b, c, d, block_words[0], 7, -680876936)
        d = ff(d, a, b, c, block_words[1], 12, -389564586)
        c = ff(c, d, a, b, block_words[2], 17, 606105819)
        b = ff(b, c, d, a, block_words[3], 22, -1044525330)
        a = ff(a, b, c, d, block_words[4], 7, -176418897)
        d = ff(d, a, b, c, block_words[5], 12, 1200080426)
        c = ff(c, d, a, b, block_words[6], 17, -1473231341)
        b = ff(b, c, d, a, block_words[7], 22, -45705983)
        a = ff(a, b, c, d, block_words[8], 7, 1770035416)
        d = ff(d, a, b, c, block_words[9], 12, -1958414417)
        c = ff(c, d, a, b, block_words[10], 17, -42063)
        b = ff(b, c, d, a, block_words[11], 22, -1990404162)
        a = ff(a, b, c, d, block_words[12], 7, 1804603682)
        d = ff(d, a, b, c, block_words[13], 12, -40341101)
        c = ff(c, d, a, b, block_words[14], 17, -1502002290)
        b = ff(b, c, d, a, block_words[15], 22, 1236535329)

        a = gg(a, b, c, d, block_words[1], 5, -165796510)
        d = gg(d, a, b, c, block_words[6], 9, -1069501632)
        c = gg(c, d, a, b, block_words[11], 14, 643717713)
        b = gg(b, c, d, a, block_words[0], 20, -373897302)
        a = gg(a, b, c, d, block_words[5], 5, -701558691)
        d = gg(d, a, b, c, block_words[10], 9, 38016083)
        c = gg(c, d, a, b, block_words[15], 14, -660478335)
        b = gg(b, c, d, a, block_words[4], 20, -405537848)
        a = gg(a, b, c, d, block_words[9], 5, 568446438)
        d = gg(d, a, b, c, block_words[14], 9, -1019803690)
        c = gg(c, d, a, b, block_words[3], 14, -187363961)
        b = gg(b, c, d, a, block_words[8], 20, 1163531501)
        a = gg(a, b, c, d, block_words[13], 5, -1444681467)
        d = gg(d, a, b, c, block_words[2], 9, -51403784)
        c = gg(c, d, a, b, block_words[7], 14, 1735328473)
        b = gg(b, c, d, a, block_words[12], 20, -1926607734)

        a = hh(a, b, c, d, block_words[5], 4, -378558)
        d = hh(d, a, b, c, block_words[8], 11, -2022574463)
        c = hh(c, d, a, b, block_words[11], 16, 1839030562)
        b = hh(b, c, d, a, block_words[14], 23, -35309556)
        a = hh(a, b, c, d, block_words[1], 4, -1530992060)
        d = hh(d, a, b, c, block_words[4], 11, 1272893353)
        c = hh(c, d, a, b, block_words[7], 16, -155497632)
        b = hh(b, c, d, a, block_words[10], 23, -1094730640)
        a = hh(a, b, c, d, block_words[13], 4, 681279174)
        d = hh(d, a, b, c, block_words[0], 11, -358537222)
        c = hh(c, d, a, b, block_words[3], 16, -722521979)
        b = hh(b, c, d, a, block_words[6], 23, 76029189)
        a = hh(a, b, c, d, block_words[9], 4, -640364487)
        d = hh(d, a, b, c, block_words[12], 11, -421815835)
        c = hh(c, d, a, b, block_words[15], 16, 530742520)
        b = hh(b, c, d, a, block_words[2], 23, -995338651)

        a = ii(a, b, c, d, block_words[0], 6, -198630844)
        d = ii(d, a, b, c, block_words[7], 10, 1126891415)
        c = ii(c, d, a, b, block_words[14], 15, -1416354905)
        b = ii(b, c, d, a, block_words[5], 21, -57434055)
        a = ii(a, b, c, d, block_words[12], 6, 1700485571)
        d = ii(d, a, b, c, block_words[3], 10, -1894986606)
        c = ii(c, d, a, b, block_words[10], 15, -1051523)
        b = ii(b, c, d, a, block_words[1], 21, -2054922799)
        a = ii(a, b, c, d, block_words[8], 6, 1873313359)
        d = ii(d, a, b, c, block_words[15], 10, -30611744)
        c = ii(c, d, a, b, block_words[6], 15, -1560198380)
        b = ii(b, c, d, a, block_words[13], 21, 1309151649)
        a = ii(a, b, c, d, block_words[4], 6, -145523070)
        d = ii(d, a, b, c, block_words[11], 10, -1120210379)
        c = ii(c, d, a, b, block_words[2], 15, 718787259)
        b = ii(b, c, d, a, block_words[9], 21, -343485551)

        state_words[0] = add32(a, state_words[0])
        state_words[1] = add32(b, state_words[1])
        state_words[2] = add32(c, state_words[2])
        state_words[3] = add32(d, state_words[3])

    def md5_block(binary_text):
        block_words = []
        for offset in range(0, 64, 4):
            block_words.append(
                ord(binary_text[offset])
                + (ord(binary_text[offset + 1]) << 8)
                + (ord(binary_text[offset + 2]) << 16)
                + (ord(binary_text[offset + 3]) << 24)
            )
        return block_words

    def md51(binary_text):
        state_words = [1732584193, -271733879, -1732584194, 271733878]
        original_length = len(binary_text)
        offset = 64

        while offset <= len(binary_text):
            md5_cycle(state_words, md5_block(binary_text[offset - 64:offset]))
            offset += 64

        binary_text = binary_text[offset - 64:]
        tail = [0] * 16
        offset = 0
        while offset < len(binary_text):
            tail[offset >> 2] |= ord(binary_text[offset]) << ((offset % 4) << 3)
            offset += 1
        tail[offset >> 2] |= 0x80 << ((offset % 4) << 3)
        if offset > 55:
            md5_cycle(state_words, tail)
            tail = [0] * 16

        tail[14] = original_length * 8
        tail[15] = original_length // 0x20000000
        md5_cycle(state_words, tail)
        return state_words

    def rhex(value):
        value &= 0xFFFFFFFF
        return "".join(f"{(value >> (index * 8)) & 0xFF:02x}" for index in range(4))

    utf8 = input_text.encode("utf-8").decode("latin1")
    return "".join(rhex(word) for word in md51(utf8))


def frontend_checksum_base(player, score, length, best_combo, played_at):
    return {
        "bestCombo": best_combo,
        "length": length,
        "playedAt": played_at,
        "player": frontend_clean_player_name(player),
        "score": score,
    }


def frontend_machine_payload(player, score, length, best_combo, played_at):
    checksum_base = frontend_checksum_base(player, score, length, best_combo, played_at)
    return {
        **checksum_base,
        "md5": frontend_md5_hex(frontend_stable_serialize(checksum_base)),
    }


def build_comment_body(machine_payload):
    return "\n".join([
        leaderboard.COMMENT_HEADER,
        "",
        f"- Player: {machine_payload['player']}",
        f"- Score: {machine_payload['score']}",
        f"- Doctoral hats: {machine_payload['length']}",
        f"- Best combo: {machine_payload['bestCombo']}",
        f"- Date: {machine_payload['playedAt']}",
        "",
        "Wall touched: academic integrity red line avoided until peer review got spicy.",
        "",
        f"<!-- academic-snake:v2 {json.dumps(machine_payload, ensure_ascii=False, sort_keys=True, separators=(',', ':'))} -->",
    ])


class AcademicSnakeChecksumTests(unittest.TestCase):
    def assertFrontendMatchesBackend(self, player, score, length, best_combo, played_at):
        frontend_payload = frontend_machine_payload(player, score, length, best_combo, played_at)
        backend_base = leaderboard.build_machine_checksum_base(frontend_payload)
        backend_md5 = leaderboard.compute_public_md5(backend_base)

        self.assertEqual(frontend_stable_serialize(backend_base), leaderboard.stable_json_dumps(backend_base))
        self.assertEqual(frontend_payload["md5"], backend_md5)

        parsed, error, status = leaderboard.parse_machine_payload(build_comment_body(frontend_payload))
        self.assertEqual((error, status), (None, "valid"))
        self.assertEqual(parsed["player_name"], backend_base["player"])
        self.assertEqual(parsed["score"], backend_base["score"])
        self.assertEqual(parsed["length"], backend_base["length"])
        self.assertEqual(parsed["best_combo"], backend_base["bestCombo"])
        self.assertEqual(parsed["checksum_status"], "valid")

    def test_known_regression_cases(self):
        cases = [
            ("antxinyuan", 2880, 69, 16, "2026-04-22T07:21:09.971Z", "3aa71857fa44863a5bd7bd33bd57dbff"),
            ("antxinyuan", 84, 6, 2, "2026-04-22T07:59:31.695Z", "061da490c0fe68b3abe7c6187ebe824e"),
            ("tester", 499, 15, 7, "2026-04-22T06:01:57.000Z", "d6ca9529191822277c5bf386f5e17f2b"),
        ]

        for player, score, length, best_combo, played_at, expected_md5 in cases:
            with self.subTest(player=player, score=score, played_at=played_at):
                payload = frontend_machine_payload(player, score, length, best_combo, played_at)
                self.assertEqual(payload["md5"], expected_md5)
                self.assertFrontendMatchesBackend(player, score, length, best_combo, played_at)

    def test_player_name_normalization_matches_backend(self):
        names = [
            "",
            "   antxinyuan   ",
            "Alice    Bob",
            "匿名 玩家",
            "very-very-long-player-name",
        ]

        for name in names:
            with self.subTest(name=name):
                self.assertEqual(frontend_clean_player_name(name), leaderboard.clean_player_name(name))

    def test_random_payloads_match_backend(self):
        rng = random.Random(20260422)
        alphabet = string.ascii_letters + string.digits + "    _-" + "测试玩家"

        for _ in range(250):
            raw_name = "".join(rng.choice(alphabet) for _ in range(rng.randint(0, 24)))
            score = rng.randint(0, 5000)
            length = rng.randint(0, 100)
            best_combo = rng.randint(0, 30)
            played_at = (
                f"2026-04-{rng.randint(1, 28):02d}T"
                f"{rng.randint(0, 23):02d}:{rng.randint(0, 59):02d}:{rng.randint(0, 59):02d}."
                f"{rng.randint(0, 999):03d}Z"
            )
            self.assertFrontendMatchesBackend(raw_name, score, length, best_combo, played_at)

    def test_build_output_only_persists_checksum_valid_entries(self):
        valid_payload = frontend_machine_payload("valid-player", 321, 12, 5, "2026-04-22T08:00:00.000Z")
        legacy_body = "\n".join([
            leaderboard.COMMENT_HEADER,
            "",
            "- Player: legacy-player",
            "- Score: 999",
            "- Doctoral hats: 20",
            "- Best combo: 8",
            "- Date: 2026/4/22 16:00:00",
        ])
        invalid_payload = dict(valid_payload)
        invalid_payload["score"] = 555
        invalid_payload["md5"] = "deadbeef"

        source_data = {
            "discussion_url": leaderboard.DISCUSSION_URL,
            "comment_count": 3,
            "comments": [
                {
                    "body": build_comment_body(valid_payload),
                    "createdAt": "2026-04-22T08:00:01Z",
                    "url": "https://example.com/comment/valid",
                    "author": {"login": "valid-user"},
                },
                {
                    "body": legacy_body,
                    "createdAt": "2026-04-22T08:00:02Z",
                    "url": "https://example.com/comment/legacy",
                    "author": {"login": "legacy-user"},
                },
                {
                    "body": build_comment_body(invalid_payload),
                    "createdAt": "2026-04-22T08:00:03Z",
                    "url": "https://example.com/comment/invalid",
                    "author": {"login": "invalid-user"},
                },
            ],
        }

        output = leaderboard.build_output(source_data)
        self.assertEqual(len(output["leaderboard"]), 1)
        self.assertEqual(output["leaderboard"][0]["github_login"], "valid-user")
        self.assertEqual(output["leaderboard"][0]["checksum_status"], "valid")
        self.assertEqual(len(output["rejected_entries"]), 1)

    def test_should_write_output_only_when_valid_leaderboard_exists(self):
        empty_payload = {"leaderboard": []}
        valid_payload = {
            "leaderboard": [
                {"github_login": "tester", "score": 100, "checksum_status": "valid"}
            ]
        }

        self.assertFalse(leaderboard.should_write_output(None, empty_payload))
        self.assertTrue(leaderboard.should_write_output(None, valid_payload))
        self.assertFalse(leaderboard.should_write_output(valid_payload, empty_payload))
        self.assertFalse(leaderboard.should_write_output(valid_payload, valid_payload))

    def test_main_does_not_write_output_for_invalid_only_fixture(self):
        invalid_body = "\n".join([
            leaderboard.COMMENT_HEADER,
            "",
            "- Player: invalid-player",
            "- Score: 777",
            "- Doctoral hats: 15",
            "- Best combo: 6",
            "- Date: 2026/4/22 16:30:00",
            "",
            "<!-- academic-snake:v2 {\"bestCombo\":6,\"length\":15,\"playedAt\":\"2026-04-22T08:30:00.000Z\",\"player\":\"invalid-player\",\"score\":777,\"md5\":\"wrong\"} -->",
        ])

        fixture = {
            "discussion_url": leaderboard.DISCUSSION_URL,
            "comment_count": 1,
            "comments": [
                {
                    "body": invalid_body,
                    "createdAt": "2026-04-22T08:30:01Z",
                    "url": "https://example.com/comment/invalid-only",
                    "author": {"login": "invalid-user"},
                }
            ],
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            fixture_path = Path(tmpdir) / "fixture.json"
            output_path = Path(tmpdir) / "leaderboard.json"
            fixture_path.write_text(json.dumps(fixture), encoding="utf-8")

            result = leaderboard.main([
                "--fixture", str(fixture_path),
                "--output", str(output_path),
            ])

            self.assertEqual(result, 0)
            self.assertFalse(output_path.exists())

    def test_main_writes_only_valid_entries_to_output_file(self):
        valid_payload = frontend_machine_payload("valid-player", 321, 12, 5, "2026-04-22T08:00:00.000Z")
        invalid_payload = dict(valid_payload)
        invalid_payload["score"] = 555
        invalid_payload["md5"] = "deadbeef"

        fixture = {
            "discussion_url": leaderboard.DISCUSSION_URL,
            "comment_count": 2,
            "comments": [
                {
                    "body": build_comment_body(valid_payload),
                    "createdAt": "2026-04-22T08:00:01Z",
                    "url": "https://example.com/comment/valid",
                    "author": {"login": "valid-user"},
                },
                {
                    "body": build_comment_body(invalid_payload),
                    "createdAt": "2026-04-22T08:00:02Z",
                    "url": "https://example.com/comment/invalid",
                    "author": {"login": "invalid-user"},
                },
            ],
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            fixture_path = Path(tmpdir) / "fixture.json"
            output_path = Path(tmpdir) / "leaderboard.json"
            fixture_path.write_text(json.dumps(fixture), encoding="utf-8")

            result = leaderboard.main([
                "--fixture", str(fixture_path),
                "--output", str(output_path),
            ])

            self.assertEqual(result, 0)
            self.assertTrue(output_path.exists())

            persisted = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(len(persisted["leaderboard"]), 1)
            self.assertEqual(persisted["leaderboard"][0]["github_login"], "valid-user")
            self.assertEqual(persisted["rejected_entries"], [])


if __name__ == "__main__":
    unittest.main()
