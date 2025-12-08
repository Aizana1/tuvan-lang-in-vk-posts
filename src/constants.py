TUVAN_CHARS = set('ңөүҢӨҮ')

# Group lists
OFFICIAL_MEDIA_GROUPS = [
    "shyn31081925",    # ШЫН - newspaper in Tuvan
    "gtrktuva",        # ГТРК «Тыва»
    "tvtyva",          # TV channel «Тува 24»
]

GOV_INSTITUTIONS_GROUPS = [
    "mintrud_tuva",
    "minobrtuva",
    "tuvaminzdrav",
    "tuvacult",
    "minfinrt", 
    "minjust.tuva",
    "molodej_tuva",
    "mincifrart",
    "minselkhoz_tuva",
    "minles17",
    "minsportrt",
    "sud17rf",
    "gov.tuva",
    "police17"
]

COMMUNITY_MEDIA_GROUPS = [
    "tuvasansara",
    "tuva_komu_za_30",
    "tovsp1",
    "read_kzl",
    "kraida_tyvalar",
    "tuva_popsa",
    "discussion_tuva",
    "setkil_001",
    "chs17rus",
    "podslushano17rus"
]

POSTS_PER_GROUP = 5000  # Maximum according to VK API
MAX_COMMENTS = 10
MAX_REQUESTS_PER_SECOND = 2  # Safe limit for VK API