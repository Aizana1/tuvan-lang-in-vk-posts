import pandas as pd
import re
from collections import defaultdict

TUVAN_CHARS = set('ңөүҢӨҮ')

def contains_tuvan_chars(text):
    if pd.isna(text):
        return False
    return any(char in TUVAN_CHARS for char in str(text))

def is_tuvan_with_russian_keyboard(text):
    """
    Эвристическая проверка тувинского языка с русской клавиатурой.
    Ищет характерные паттерны тувинских слов без спецбукв.
    """
    if pd.isna(text):
        return False
    
    text_lower = str(text).lower()
    
    # Характерные тувинские слова/паттерны без спецбукв
    tuvan_words = [
        # Местоимения и частые слова
        r'\bмен\b', r'\bсен\b', r'\bбис\b', r'\bсилер\b',
        r'\bчуве\b', r'\bчок\b', r'\bбар\b', r'\bтур\b',
        r'\bболур\b', r'\bдээш\b', r'\bкылыр\b',
        
        # Часто встречающиеся слова
        r'\bбистин\b', r'\bмээн\b', r'\bсилернин\b', 
        r'\bачамнын\b', r'\bавамнын\b', r'\bачазы\b', r'\bавазы\b',
        r'\bооренир\b', r'\bооренип\b', r'\bооредилге\b', r'\bоршээ\b',
        r'\bог-буле\b', r'\bтыванын\b', r'\bог-буленин\b', 
        r'\bог-булезинге\b', r'\bог-булелиг\b',
        r'\bменээ\b', r'\bортек\b', r'\bортээ\b',
        r'\bкожууннун\b', r'\bторуттунген\b',
        r'\bчуректиг\b', r'\bчуректеривиске\b', r'\bчурек\b', r'\bчуректер\b',
        r'\bмонгеде\b', r'\bсоолгу\b', r'\bулегер\b',
        r'\bбригадазынын\b', r'\bоглувустун\b', r'\bсумузунун\b', r'\bозуп\b',
        
        # Характерные суффиксы и окончания тувинского языка
        r'\w+нын\b',      # родительный падеж: кожууннун, ачамнын
        r'\w+зы\b',       # притяжательный: ачазы, авазы
        r'\w+ынын\b',     # родительный: бригадазынын
        r'\w+устун\b',    # оглувустун
        r'\w+узунун\b',   # сумузунун
        r'\w+ээ\b',       # оршээ, менээ, ортээ
        r'\w+иг\b',       # чуректиг, ог-булелиг
        r'\w+иске\b',     # чуректеривиске
        r'\w+илге\b',     # ооредилге
        r'\bоо\w+\b',     # слова начинающиеся с "оо": ооренир, ооренип
    ]
    
    matches = 0
    for pattern in tuvan_words:
        if re.search(pattern, text_lower):
            matches += 1
            if matches >= 1:
                return True
    
    return False

def classify_text(text):
    """
    Классифицирует текст по категориям:
    a) тувинский с тувинскими буквами
    b) тувинский с русской клавиатурой
    c) русский
    """
    if pd.isna(text):
        return 'c'
    
    has_tuvan_chars = contains_tuvan_chars(text)
    has_tuvan_keyboard = is_tuvan_with_russian_keyboard(text)
    
    # Правила классификации
    if has_tuvan_chars:
        return 'a'  # Есть ң,ө,ү -> тувинский с тувинскими буквами
    elif has_tuvan_keyboard:
        return 'b'  # Тувинский с русской клавиатурой
    else:
        return 'c'  # Русский

def analyze_dataset(file_path):
    try:
        # Пробуем с разными параметрами для корректного чтения многострочных полей
        df = pd.read_csv(file_path, encoding='utf-8', quoting=1, escapechar='\\', on_bad_lines='skip')
    except:
        try:
            df = pd.read_csv(file_path, encoding='cp1251', quoting=1, escapechar='\\', on_bad_lines='skip')
        except:
            try:
                df = pd.read_csv(file_path, encoding='utf-8-sig', quoting=1, escapechar='\\', on_bad_lines='skip')
            except Exception as e:
                print(f"Ошибка при чтении файла {file_path}: {e}")
                return {}
    
    df['year'] = df.apply(lambda row: row['post_year'] if row['type'] == 'post' else row['comment_year'], axis=1)
    df['text'] = df.apply(lambda row: row['post_text'] if row['type'] == 'post' else row['comment_text'], axis=1)
    
    df['language_category'] = df['text'].apply(classify_text)
    
    results = {}
    
    # Группировка по годам
    for year in sorted(df['year'].dropna().unique()):
        year_data = df[df['year'] == year]
        
        # Разделение на посты и комментарии
        posts = year_data[year_data['type'] == 'post']
        comments = year_data[year_data['type'] == 'comment']
        
        results[int(year)] = {
            'posts': analyze_group(posts),
            'comments': analyze_group(comments)
        }
    
    return results

def analyze_group(data):
    """Анализирует группу данных (посты или комментарии)"""
    total = len(data)
    
    if total == 0:
        return {
            'total': 0,
            'a_count': 0, 'a_percent': 0,
            'b_count': 0, 'b_percent': 0,
            'c_count': 0, 'c_percent': 0
        }
    
    counts = data['language_category'].value_counts()
    
    a_count = counts.get('a', 0)
    b_count = counts.get('b', 0)
    c_count = counts.get('c', 0)
    
    return {
        'total': total,
        'a_count': int(a_count),
        'a_percent': round(a_count / total * 100, 2),
        'b_count': int(b_count),
        'b_percent': round(b_count / total * 100, 2),
        'c_count': int(c_count),
        'c_percent': round(c_count / total * 100, 2)
    }

def print_results(results, dataset_name):
    print(f"\n{'='*60}")
    print(f"РЕЗУЛЬТАТЫ ДЛЯ: {dataset_name}")
    print(f"{'='*60}")
    
    for year, data in results.items():
        print(f"\n--- ГОД: {year} ---")
        
        print("\nПОСТЫ:")
        p = data['posts']
        print(f"  Всего: {p['total']}")
        print(f"  (a) Тувинский с ң,ө,ү: {p['a_count']} ({p['a_percent']}%)")
        print(f"  (b) Тувинский (рус. клавиатура): {p['b_count']} ({p['b_percent']}%)")
        print(f"  (c) Русский: {p['c_count']} ({p['c_percent']}%)")
        
        print("\nКОММЕНТАРИИ:")
        c = data['comments']
        print(f"  Всего: {c['total']}")
        print(f"  (a) Тувинский с ң,ө,ү: {c['a_count']} ({c['a_percent']}%)")
        print(f"  (b) Тувинский (рус. клавиатура): {c['b_count']} ({c['b_percent']}%)")
        print(f"  (c) Русский: {c['c_count']} ({c['c_percent']}%)")

def export_results_to_csv(results, output_file):
    rows = []
    
    for year, data in results.items():
        for content_type in ['posts', 'comments']:
            d = data[content_type]
            rows.append({
                'Год': year,
                'Тип': 'Посты' if content_type == 'posts' else 'Комментарии',
                'Всего': d['total'],
                'Тувинский_ңөү_кол': d['a_count'],
                'Тувинский_ңөү_%': d['a_percent'],
                'Тувинский_рус_клав_кол': d['b_count'],
                'Тувинский_рус_клав_%': d['b_percent'],
                'Русский_кол': d['c_count'],
                'Русский_%': d['c_percent']
            })
    
    df_results = pd.DataFrame(rows)
    df_results.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"\nРезультаты сохранены в: {output_file}")

if __name__ == "__main__":
    import os
    os.makedirs('../dataset/results', exist_ok=True)
    
    datasets = [
        '../dataset/raw/official_media_posts.csv',
        '../dataset/raw/community_media_posts.csv',
        '../dataset/raw/gov_institutions_posts.csv'
    ]
    
    all_results = {}
    
    for dataset_file in datasets:
        print(f"\nОбработка {dataset_file}...")
        
        results = analyze_dataset(dataset_file)
        
        all_results[dataset_file] = results
        print_results(results, dataset_file)
        
        filename = dataset_file.split('/')[-1].replace('.csv', '')
        output_file = f"../dataset/results/results_{filename}.csv"
        export_results_to_csv(results, output_file)
    
    print("\n" + "="*60)
    print("АНАЛИЗ ЗАВЕРШЁН")
    print("="*60)