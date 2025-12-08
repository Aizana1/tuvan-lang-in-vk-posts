import aiohttp
import asyncio
import pandas as pd
import os
import time
from datetime import datetime
from dotenv import load_dotenv
from constants import (
    OFFICIAL_MEDIA_GROUPS,
    GOV_INSTITUTIONS_GROUPS,
    COMMUNITY_MEDIA_GROUPS,
    POSTS_PER_GROUP,
    MAX_COMMENTS,
    MAX_REQUESTS_PER_SECOND,
)
load_dotenv()

ACCESS_TOKEN = os.getenv("VK_ACCESS_TOKEN")
API_VERSION = "5.199"
OUTPUT_DIR = "dataset/raw"
os.makedirs(OUTPUT_DIR, exist_ok=True)

OFFICIAL_MEDIA_OUTPUT_FILE = os.path.join(OUTPUT_DIR, "official_media_posts.csv")
GOV_INSTITUTIONS_OUTPUT_FILE = os.path.join(OUTPUT_DIR, "gov_institutions_posts.csv")
COMMUNITY_MEDIA_OUTPUT_FILE = os.path.join(OUTPUT_DIR, "community_media_posts.csv")

ALL_CATEGORIES = {
    "OfficialMedia": OFFICIAL_MEDIA_GROUPS,
    "GovInstitutions": GOV_INSTITUTIONS_GROUPS,
    "CommunityMedia": COMMUNITY_MEDIA_GROUPS
}

CATEGORIES = {
    "OfficialMedia": {
        "groups": OFFICIAL_MEDIA_GROUPS,
        "output": OFFICIAL_MEDIA_OUTPUT_FILE
    },
    "GovInstitutions": {
        "groups": GOV_INSTITUTIONS_GROUPS,
        "output": GOV_INSTITUTIONS_OUTPUT_FILE
    },
    "CommunityMedia": {
        "groups": COMMUNITY_MEDIA_GROUPS,
        "output": COMMUNITY_MEDIA_OUTPUT_FILE
    }
}


def unix_timestamp_to_datetime(timestamp):
    """Convert Unix timestamp to datetime string"""
    if timestamp is None or timestamp == 0:
        return None
    try:
        return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')
    except:
        return None


def get_year_from_timestamp(timestamp):
    if timestamp is None or timestamp == 0:
        return None
    try:
        return datetime.fromtimestamp(timestamp).year
    except:
        return None


class RateLimiter:
    def __init__(self, rate_limit=MAX_REQUESTS_PER_SECOND):
        self.rate_limit = rate_limit
        self.interval = 1.0 / rate_limit
        self.last_request_time = 0
        self.lock = asyncio.Lock()
    
    async def wait(self):
        async with self.lock:
            current_time = time.time()
            elapsed = current_time - self.last_request_time
            
            if elapsed < self.interval:
                wait_time = self.interval - elapsed
                await asyncio.sleep(wait_time)
            
            self.last_request_time = time.time()


rate_limiter = RateLimiter()


async def fetch(session, url, params):
    await rate_limiter.wait()
    
    timeout = aiohttp.ClientTimeout(total=30)
    try:
        async with session.get(url, params=params, timeout=timeout) as resp:
            data = await resp.json()
            if "error" in data:
                err = data["error"]
                error_code = err.get('error_code')
                error_msg = err.get('error_msg')
                print(f"⚠️ VK API Error {error_code}: {error_msg}")
                
                # If rate limit error - wait longer
                if error_code in [6, 29]:  # Too many requests
                    print("🔄 Too many requests, waiting 10 seconds...")
                    await asyncio.sleep(10)
                    return None
                return None
            return data.get("response", {})
    except asyncio.TimeoutError:
        print(f"⏰ Timeout while requesting {url}")
        return None
    except Exception as e:
        print(f"❌ Request error: {e}")
        return None


async def get_owner_id(session, group_name):
    print(f"  Getting owner_id for '{group_name}'...")
    
    group_name = group_name.strip()

    if "vk.com/" in group_name:
        group_name = group_name.split("vk.com/")[-1].strip("/")

    if group_name.startswith(("club", "public", "id")):
        group_name = group_name.lstrip("club").lstrip("public").lstrip("id")

    params = {
        "group_id": group_name,
        "access_token": ACCESS_TOKEN,
        "v": API_VERSION,
    }

    url = "https://api.vk.com/method/groups.getById"

    data = await fetch(session, url, params)
    if data is None:
        return None

    # Process new response format
    if isinstance(data, dict) and "groups" in data:
        groups_list = data.get("groups", [])
        if groups_list:
            group_info = groups_list[0]
            group_id = group_info.get("id")
            if group_id:
                owner_id = -abs(group_id)
                print(f"  ✅ owner_id for '{group_name}': {owner_id}")
                return owner_id
    
    # For backward compatibility: old format
    elif isinstance(data, list) and data:
        group_info = data[0]
        group_id = group_info.get("id")
        if group_id:
            owner_id = -abs(group_id)
            print(f"  ✅ owner_id for '{group_name}': {owner_id}")
            return owner_id

    print(f"⚠ Invalid VK response for owner_id of '{group_name}'")
    return None


async def get_posts(session, domain, count=100, offset=0):
    print(f"    Requesting posts from {domain} (offset={offset}, count={count})...")
    
    url = "https://api.vk.com/method/wall.get"
    params = {
        "access_token": ACCESS_TOKEN,
        "v": API_VERSION,
        "domain": domain,
        "count": min(count, 100),  # VK maximum 100 per request
        "offset": offset
    }
    
    data = await fetch(session, url, params)
    if data and "items" in data:
        return data.get("items", [])
    return []


async def get_comments(session, owner_id, post_id, max_comments=5):
    url = "https://api.vk.com/method/wall.getComments"
    params = {
        "access_token": ACCESS_TOKEN,
        "v": API_VERSION,
        "owner_id": owner_id,
        "post_id": post_id,
        "count": min(100, max_comments * 2),
        "sort": "desc",
        "extended": 0
    }
    
    data = await fetch(session, url, params)
    if not data:
        return []
    
    items = data.get("items", [])
    items = sorted(items, key=lambda x: x.get("likes", {}).get("count", 0), reverse=True)
    return items[:max_comments]


async def get_all_posts_from_group(session, domain, max_posts=5000):
    """Gets ALL posts from a group (up to specified maximum)"""
    print(f"  📊 Loading ALL posts from group {domain}...")
    
    all_posts = []
    offset = 0
    batch_size = 100
    
    while len(all_posts) < max_posts:
        posts_batch = await get_posts(session, domain, batch_size, offset)
        
        if not posts_batch:
            print(f"    No more posts to load")
            break
        
        if offset == 0 and posts_batch:
            print(f"    First batch loaded: {len(posts_batch)} posts")
        
        all_posts.extend(posts_batch)
        
        print(f"    Loaded {len(all_posts)} posts...")
        
        if len(posts_batch) < batch_size:
            print(f"    All posts loaded (received less than requested)")
            break
        
        offset += batch_size
        
        if offset % 300 == 0:  # Every 300 posts take a pause
            print(f"    ⏸️ Pausing for 1 second...")
            await asyncio.sleep(1)
        
        await asyncio.sleep(0.3)
    
    print(f"  ✅ Total {len(all_posts)} posts loaded from {domain}")
    return all_posts


async def process_group(session, category, group):
    """Processes one group: ALL posts + comments"""
    print(f"  Processing group: {group}")
    
    owner_id = await get_owner_id(session, group)
    if not owner_id:
        print(f"  ❌ Failed to get owner_id for {group}")
        return []

    all_posts = await get_all_posts_from_group(session, group, POSTS_PER_GROUP)
    
    if not all_posts:
        print(f"  ℹ️ No posts found in group {group}")
        return []
    
    print(f"  📊 Starting processing of {len(all_posts)} posts from {group}...")
    
    group_data = []
    
    for i, post in enumerate(all_posts, 1):
        if i % 20 == 0 or i == 1 or i == len(all_posts): 
            print(f"    Processed {i}/{len(all_posts)} posts...")
        
        post_id = post["id"]
        post_text = post.get("text", "")
        post_likes = post.get("likes", {}).get("count", 0)
        comments_count = post.get("comments", {}).get("count", 0)
        post_date_unix = post.get("date", 0)
        
        # Convert Unix timestamp to datetime
        post_date = unix_timestamp_to_datetime(post_date_unix)
        post_year = get_year_from_timestamp(post_date_unix)
        
        group_data.append({
            "type": "post",
            "category": category,
            "group": group,
            "post_id": post_id,
            "post_text": post_text,
            "post_likes": post_likes,
            "post_comments_count": comments_count,
            "post_date_unix": post_date_unix,
            "post_date": post_date,
            "post_year": post_year,
            "comment_id": None,
            "comment_text": None,
            "comment_likes": None,
            "comment_date_unix": None,
            "comment_date": None,
            "comment_year": None
        })
        
        if comments_count == 0:
            continue
        
        comments = await get_comments(session, owner_id, post_id, MAX_COMMENTS)
        
        for c in comments:
            comment_date_unix = c.get("date", 0)
            comment_date = unix_timestamp_to_datetime(comment_date_unix)
            comment_year = get_year_from_timestamp(comment_date_unix)
            
            group_data.append({
                "type": "comment",
                "category": category,
                "group": group,
                "post_id": post_id,
                "post_text": post_text,
                "post_likes": post_likes,
                "post_comments_count": comments_count,
                "post_date_unix": post_date_unix,
                "post_date": post_date,
                "post_year": post_year,
                "comment_id": c["id"],
                "comment_text": c.get("text", ""),
                "comment_likes": c.get("likes", {}).get("count", 0),
                "comment_date_unix": comment_date_unix, 
                "comment_date": comment_date,
                "comment_year": comment_year
            })
        
        if i % 10 == 0:
            await asyncio.sleep(0.2)
    
    print(f"  ✅ Group {group} processed, collected {len(group_data)} records (posts + comments)")
    return group_data


async def main():
    print("🚀 Starting data collection from VK groups...")
    print(f"📊 Total categories: {len(CATEGORIES)}")
    
    timeout = aiohttp.ClientTimeout(total=1800)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        for cat_name, cat_data in CATEGORIES.items():
            groups = cat_data["groups"]
            output_file = cat_data["output"]

            print(f"\n{'='*60}")
            print(f"📋 Category: {cat_name} ({len(groups)} groups)")
            print(f"💾 Output file: {output_file}")
            print(f"{'='*60}")

            all_records = []
            
            for i, group_name in enumerate(groups, 1):
                print(f"\n[{i}/{len(groups)}] ", end="")
                try:
                    records = await process_group(session, cat_name, group_name)
                    if records:
                        all_records.extend(records)
                    
                    if i < len(groups):
                        print(f"    ⏸️ Pausing for 3 seconds before next group...")
                        await asyncio.sleep(3)
                        
                except Exception as e:
                    print(f"❌ Critical error processing {group_name}: {e}")
                    import traceback
                    traceback.print_exc()
                    continue
            
            if all_records:
                df = pd.DataFrame(all_records)
                df.to_csv(output_file, index=False, encoding="utf-8-sig")
                print(f"📁 Output directory: {os.path.abspath(OUTPUT_DIR)}")
                print(f"\n✅ Saved {len(df)} records to file {output_file}")
                
                # Statistics
                post_count = len(df[df['type'] == 'post'])
                comment_count = len(df[df['type'] == 'comment'])
                
                # Year statistics for posts
                if 'post_year' in df.columns:
                    post_years = df[df['post_year'].notna()]['post_year']
                    if not post_years.empty:
                        print(f"   📅 Post years range: {int(post_years.min())} - {int(post_years.max())}")
                
                # Year statistics for comments
                if 'comment_year' in df.columns:
                    comment_years = df[df['comment_year'].notna()]['comment_year']
                    if not comment_years.empty:
                        print(f"   📅 Comment years range: {int(comment_years.min())} - {int(comment_years.max())}")
                
                print(f"   📊 Statistics: {post_count} posts, {comment_count} comments")
            else:
                print(f"⚠️ No data collected for category {cat_name}")
            
            # Pause between categories
            if cat_name != list(CATEGORIES.keys())[-1]:
                print(f"\n⏸️ Pausing for 10 seconds before next category...")
                await asyncio.sleep(10)
    
    print("\n" + "="*60)
    print("🎉 ALL data collection completed!")
    print("="*60)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️ Script interrupted by user")
        print("💾 Attempting to save already collected data...")
    except Exception as e:
        print(f"\n\n❌ Critical error: {e}")
        import traceback
        traceback.print_exc()