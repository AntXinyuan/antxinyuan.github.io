from scholarly import scholarly
import json
from datetime import datetime
import os

GOOGLE_SCHOLAR_UID = 'eXwizz8AAAAJ'

try:
    author: dict = scholarly.search_author_id(GOOGLE_SCHOLAR_UID)
    scholarly.fill(author, sections=['publications'])
    result = {
        'user_id': GOOGLE_SCHOLAR_UID,
        'name': author.get('name', ''),
        'affiliation': author.get('affiliation', ''),
        'homepage': author.get('homepage', ''),
        'interests': author.get('interests', []),
        'citedby': str(author.get('citedby', '0')),
        'updated': str(datetime.now()),
        'publications': {
            publication['author_pub_id']: {
                'pub_id': publication['author_pub_id'],
                'num_citations': str(publication.get('num_citations', '0'))
            }
            for publication in author.get('publications', [])
            if publication.get('author_pub_id')
        }
    }
    print(json.dumps(result, indent=2))
    os.makedirs('results', exist_ok=True)
    with open('scholar.json', 'w') as outfile:
        json.dump(result, outfile, ensure_ascii=False, indent=2)
except Exception as e:
    print(e)
