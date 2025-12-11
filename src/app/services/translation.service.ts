// translation.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'ru' | 'en';

interface Translations {
  ru: Translation;
  en: Translation;
}

interface Translation {
  // Заголовки
  pageTitle: string;
  
  // Фильтры
  selectYears: string;
  dataType: string;
  dataSources: string;
  
  // Типы данных
  posts: string;
  comments: string;
  
  // Источники
  community: string;
  government: string;
  official: string;
  
  // Языки контента
  tuvanNgu: string;
  tuvanRusKeyboard: string;
  russian: string;
  
  // Графики
  chartLineTitle: string;
  chartBarTitle: string;
  chartStackedTitle: string;
  chartPieTitle: string;
  
  // Оси
  axisPercent: string;
  axisCount: string;
  axisAvgPercent: string;
  
  // Сводка
  summaryTitle: string;
  totalRecords: string;
  average: string;
  
  // Статусы
  loading: string;
  error: string;
  noData: string;
  noDataHint: string;
  
  // Переключатель языка
  switchLanguage: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage$ = new BehaviorSubject<Language>('ru');
  
  private translations: Translations = {
    ru: {
      pageTitle: 'Анализ данных по языкам (2018-2025)',
      
      selectYears: 'Выберите годы:',
      dataType: 'Тип данных:',
      dataSources: 'Источники данных:',
      
      posts: 'Посты',
      comments: 'Комментарии',
      
      community: 'Сообщества',
      government: 'Госучреждения',
      official: 'Официальные СМИ',
      
      tuvanNgu: 'Тувинский (ңөү)',
      tuvanRusKeyboard: 'Тувинский (рус. клав.)',
      russian: 'Русский',
      
      chartLineTitle: 'Динамика процентного соотношения языков',
      chartBarTitle: 'Количество записей по языкам',
      chartStackedTitle: 'Распределение по источникам данных',
      chartPieTitle: 'Общее распределение по языкам',
      
      axisPercent: 'Процент (%)',
      axisCount: 'Количество',
      axisAvgPercent: 'Средний процент (%)',
      
      summaryTitle: 'Сводная информация (отфильтрованные данные):',
      totalRecords: 'Всего записей',
      average: 'средний',
      
      loading: 'Загрузка данных из CSV файлов...',
      error: 'Ошибка:',
      noData: 'Нет данных для отображения с выбранными фильтрами.',
      noDataHint: 'Попробуйте изменить параметры фильтрации.',
      
      switchLanguage: 'Switch to English'
    },
    en: {
      pageTitle: 'Language Data Analysis (2018-2025)',
      
      selectYears: 'Select years:',
      dataType: 'Data type:',
      dataSources: 'Data sources:',
      
      posts: 'Posts',
      comments: 'Comments',
      
      community: 'Communities',
      government: 'Government Institutions',
      official: 'Official Media',
      
      tuvanNgu: 'Tuvan (ңөү)',
      tuvanRusKeyboard: 'Tuvan (Rus. keyboard)',
      russian: 'Russian',
      
      chartLineTitle: 'Language Percentage Dynamics',
      chartBarTitle: 'Number of Records by Language',
      chartStackedTitle: 'Distribution by Data Source',
      chartPieTitle: 'Overall Language Distribution',
      
      axisPercent: 'Percent (%)',
      axisCount: 'Count',
      axisAvgPercent: 'Average Percent (%)',
      
      summaryTitle: 'Summary Information (filtered data):',
      totalRecords: 'Total Records',
      average: 'average',
      
      loading: 'Loading data from CSV files...',
      error: 'Error:',
      noData: 'No data to display with selected filters.',
      noDataHint: 'Try changing the filter parameters.',
      
      switchLanguage: 'Переключить на русский'
    }
  };

  constructor() {
    // Загружаем сохраненный язык из localStorage
    const savedLang = localStorage.getItem('appLanguage') as Language;
    if (savedLang && (savedLang === 'ru' || savedLang === 'en')) {
      this.currentLanguage$.next(savedLang);
    }
  }

  /**
   * Получить текущий язык
   */
  getCurrentLanguage(): Language {
    return this.currentLanguage$.value;
  }

  /**
   * Наблюдать за изменениями языка
   */
  getCurrentLanguage$(): Observable<Language> {
    return this.currentLanguage$.asObservable();
  }

  /**
   * Установить язык
   */
  setLanguage(lang: Language): void {
    this.currentLanguage$.next(lang);
    localStorage.setItem('appLanguage', lang);
  }

  /**
   * Переключить язык
   */
  toggleLanguage(): void {
    const current = this.getCurrentLanguage();
    const newLang: Language = current === 'ru' ? 'en' : 'ru';
    this.setLanguage(newLang);
  }

  /**
   * Получить перевод для ключа
   */
  translate(key: keyof Translation): string {
    const lang = this.getCurrentLanguage();
    return this.translations[lang][key];
  }

  /**
   * Получить все переводы для текущего языка
   */
  getTranslations(): Translation {
    const lang = this.getCurrentLanguage();
    return this.translations[lang];
  }

  /**
   * Перевести тип данных
   */
  translateDataType(type: string): string {
    if (type === 'Посты' || type === 'Posts') {
      return this.translate('posts');
    }
    if (type === 'Комментарии' || type === 'Comments') {
      return this.translate('comments');
    }
    return type;
  }

  /**
   * Перевести источник данных
   */
  translateSource(source: 'community' | 'government' | 'official'): string {
    return this.translate(source);
  }
}