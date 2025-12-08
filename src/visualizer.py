import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px

def load_results(file_path):
    """Загружает CSV с результатами анализа"""
    return pd.read_csv(file_path, encoding='utf-8-sig')

def create_language_distribution_pie(df, group_name):
    """
    Создаёт круговую диаграмму распределения языков
    """
    # Суммируем по всем годам
    total_tuvan_special = df['Тувинский_ңөү_кол'].sum()
    total_tuvan_rus = df['Тувинский_рус_клав_кол'].sum()
    total_russian = df['Русский_кол'].sum()
    
    fig = go.Figure(data=[go.Pie(
        labels=['Тувинский (ң,ө,ү)', 'Тувинский (рус. клав.)', 'Русский'],
        values=[total_tuvan_special, total_tuvan_rus, total_russian],
        hole=0.3,
        marker=dict(colors=['#FF6B6B', '#4ECDC4', '#45B7D1']),
        textinfo='label+percent+value',
        textfont=dict(size=14)
    )])
    
    fig.update_layout(
        title=f'Распределение языков: {group_name}',
        title_font_size=20,
        height=500
    )
    
    return fig

def create_posts_comments_comparison(df, group_name):
    """
    Создаёт столбчатую диаграмму сравнения постов и комментариев по годам
    """
    posts_df = df[df['Тип'] == 'Посты']
    comments_df = df[df['Тип'] == 'Комментарии']
    
    fig = go.Figure()
    
    # Посты
    fig.add_trace(go.Bar(
        name='Посты',
        x=posts_df['Год'],
        y=posts_df['Всего'],
        marker_color='#FF6B6B'
    ))
    
    # Комментарии
    fig.add_trace(go.Bar(
        name='Комментарии',
        x=comments_df['Год'],
        y=comments_df['Всего'],
        marker_color='#4ECDC4'
    ))
    
    fig.update_layout(
        title=f'Количество постов и комментариев по годам: {group_name}',
        title_font_size=18,
        xaxis_title='Год',
        yaxis_title='Количество',
        barmode='group',
        height=500,
        hovermode='x unified'
    )
    
    return fig

def create_language_trend(df, group_name):
    """
    Создаёт линейный график тренда использования языков по годам
    """
    # Группируем по годам
    yearly = df.groupby('Год').agg({
        'Тувинский_ңөү_%': 'mean',
        'Тувинский_рус_клав_%': 'mean',
        'Русский_%': 'mean'
    }).reset_index()
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=yearly['Год'],
        y=yearly['Тувинский_ңөү_%'],
        mode='lines+markers',
        name='Тувинский (ң,ө,ү)',
        line=dict(color='#FF6B6B', width=3),
        marker=dict(size=10)
    ))
    
    fig.add_trace(go.Scatter(
        x=yearly['Год'],
        y=yearly['Тувинский_рус_клав_%'],
        mode='lines+markers',
        name='Тувинский (рус. клав.)',
        line=dict(color='#4ECDC4', width=3),
        marker=dict(size=10)
    ))
    
    fig.add_trace(go.Scatter(
        x=yearly['Год'],
        y=yearly['Русский_%'],
        mode='lines+markers',
        name='Русский',
        line=dict(color='#45B7D1', width=3),
        marker=dict(size=10)
    ))
    
    fig.update_layout(
        title=f'Тренд использования языков (%): {group_name}',
        title_font_size=18,
        xaxis_title='Год',
        yaxis_title='Процент (%)',
        height=500,
        hovermode='x unified',
        legend=dict(
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=0.01
        )
    )
    
    return fig

def create_stacked_bar_languages(df, group_name):
    """
    Создаёт составную столбчатую диаграмму (100% stacked)
    показывающую процентное соотношение языков
    """
    fig = go.Figure()
    
    years = sorted(df['Год'].unique())
    
    for year in years:
        year_data = df[df['Год'] == year]
        
        tuvan_special = year_data['Тувинский_ңөү_%'].mean()
        tuvan_rus = year_data['Тувинский_рус_клав_%'].mean()
        russian = year_data['Русский_%'].mean()
        
        fig.add_trace(go.Bar(
            name=str(year),
            x=['Тувинский (ң,ө,ү)', 'Тувинский (рус. клав.)', 'Русский'],
            y=[tuvan_special, tuvan_rus, russian],
        ))
    
    fig.update_layout(
        title=f'Распределение языков по годам (%): {group_name}',
        title_font_size=18,
        xaxis_title='Язык',
        yaxis_title='Процент (%)',
        barmode='group',
        height=500
    )
    
    return fig

def create_comparison_all_groups(results_files):
    """
    Создаёт сравнительную диаграмму между всеми тремя группами
    """
    all_data = []
    
    for file_path, group_name in results_files:
        df = load_results(file_path)
        total_tuvan_special = df['Тувинский_ңөү_кол'].sum()
        total_tuvan_rus = df['Тувинский_рус_клав_кол'].sum()
        total_russian = df['Русский_кол'].sum()
        total = total_tuvan_special + total_tuvan_rus + total_russian
        
        all_data.append({
            'Группа': group_name,
            'Тувинский (ң,ө,ү)': (total_tuvan_special / total * 100) if total > 0 else 0,
            'Тувинский (рус. клав.)': (total_tuvan_rus / total * 100) if total > 0 else 0,
            'Русский': (total_russian / total * 100) if total > 0 else 0
        })
    
    df_comparison = pd.DataFrame(all_data)
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        name='Тувинский (ң,ө,ү)',
        x=df_comparison['Группа'],
        y=df_comparison['Тувинский (ң,ө,ү)'],
        marker_color='#FF6B6B'
    ))
    
    fig.add_trace(go.Bar(
        name='Тувинский (рус. клав.)',
        x=df_comparison['Группа'],
        y=df_comparison['Тувинский (рус. клав.)'],
        marker_color='#4ECDC4'
    ))
    
    fig.add_trace(go.Bar(
        name='Русский',
        x=df_comparison['Группа'],
        y=df_comparison['Русский'],
        marker_color='#45B7D1'
    ))
    
    fig.update_layout(
        title='Сравнение использования языков между группами (%)',
        title_font_size=20,
        xaxis_title='Группа VK',
        yaxis_title='Процент (%)',
        barmode='stack',
        height=600,
        hovermode='x unified'
    )
    
    return fig

def generate_all_visualizations():
    """
    Генерирует все визуализации и сохраняет их
    """
    import os
    
    # Создаём папку для графиков
    os.makedirs('../dataset/visualizations', exist_ok=True)
    
    # Пути к файлам с результатами
    results_files = [
        ('../dataset/results/results_official_media_posts.csv', 'Официальные медиа'),
        ('../dataset/results/results_community_media_posts.csv', 'Сообщества'),
        ('../dataset/results/results_gov_institutions_posts.csv', 'Гос. учреждения')
    ]
    
    print("Создание визуализаций...")
    
    # Для каждой группы создаём индивидуальные графики
    for file_path, group_name in results_files:
        print(f"\nОбработка группы: {group_name}")
        
        df = load_results(file_path)
        
        # Круговая диаграмма
        fig1 = create_language_distribution_pie(df, group_name)
        filename = file_path.split('/')[-1].replace('results_', '').replace('.csv', '')
        fig1.write_html(f'../dataset/visualizations/{filename}_pie.html')
        print(f"  ✓ Круговая диаграмма сохранена")
        
        # Столбчатая диаграмма постов/комментариев
        fig2 = create_posts_comments_comparison(df, group_name)
        fig2.write_html(f'../dataset/visualizations/{filename}_posts_comments.html')
        print(f"  ✓ Сравнение постов/комментариев сохранено")
        
        # Линейный тренд
        fig3 = create_language_trend(df, group_name)
        fig3.write_html(f'../dataset/visualizations/{filename}_trend.html')
        print(f"  ✓ Тренд использования языков сохранён")
        
        # Составная диаграмма
        fig4 = create_stacked_bar_languages(df, group_name)
        fig4.write_html(f'../dataset/visualizations/{filename}_stacked.html')
        print(f"  ✓ Составная диаграмма сохранена")
    
    # Сравнительная диаграмма всех групп
    print("\nСоздание сравнительной диаграммы...")
    fig_comparison = create_comparison_all_groups(results_files)
    fig_comparison.write_html('../dataset/visualizations/comparison_all_groups.html')
    print("  ✓ Сравнительная диаграмма сохранена")
    
    print("\n" + "="*60)
    print("ВСЕ ВИЗУАЛИЗАЦИИ СОЗДАНЫ!")
    print("Файлы сохранены в: dataset/visualizations/")
    print("="*60)

if __name__ == "__main__":
    generate_all_visualizations()