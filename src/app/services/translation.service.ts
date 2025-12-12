import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export type Language = "ru" | "en";

interface Translations {
  ru: Translation;
  en: Translation;
}

interface Translation {
  pageTitle: string;
  aboutProjectTitle: string;
  aboutProject: string;
  methodologyTitle: string;
  methodology: string;
  significanceTitle: string;
  significance: string;
  selectYears: string;
  dataType: string;
  dataSources: string;
  posts: string;
  comments: string;
  community: string;
  government: string;
  official: string;
  tuvanNgu: string;
  tuvanRusKeyboard: string;
  russian: string;
  chartLineTitle: string;
  chartBarTitle: string;
  chartStackedTitle: string;
  chartPieTitle: string;
  axisPercent: string;
  axisCount: string;
  axisAvgPercent: string;
  summaryTitle: string;
  totalRecords: string;
  average: string;
  loading: string;
  error: string;
  noData: string;
  noDataHint: string;
  switchLanguage: string;
}

@Injectable({
  providedIn: "root",
})
export class TranslationService {
  private currentLanguage$ = new BehaviorSubject<Language>("ru");

  private translations: Translations = {
    ru: {
      pageTitle:
        "Цифровая карта языкового ландшафта Республики Тыва (2018-2025)",
      aboutProjectTitle: "О проекте",
      aboutProject:
        "Данное исследование представляет собой комплексный анализ языковых практик в цифровом пространстве Республики Тыва. В основе работы лежит изучение 407.000 постов и комментариев, собранных через VK API из трёх типов сообществ: официальных групп государственных учреждений, региональных медиа и местных общественных объединений.",
      methodologyTitle: "Методология",
      methodology: `Исследование выявляет три основных языковых категории в онлайн-коммуникации:<br><br>
    <b>Тувинский язык с использованием специальных символов (ң, ө, ү, Ң, Ө, Ү)</b> — тексты, сохраняющие аутентичную орфографию тувинского языка и отражающие стремление пользователей к языковой точности. <br><br>
      <b>Тувинский язык на кириллице</b> — адаптированные тексты без специальных букв. Для их идентификации была разработана эвристическая система анализа, основанная на распознавании характерных тувинских словоформ, суффиксов и грамматических паттернов, что позволило отделить тувинские тексты от русскоязычных в условиях общей кириллической графики. <br><br>
      <b>Русский язык</b> — тексты на государственном языке Российской Федерации.`,
      significanceTitle: "Значимость работы",
      significance:
        "Исследование документирует живую языковую ситуацию в цифровой среде региона, показывая, как носители тувинского языка адаптируют его к ограничениям клавиатурных раскладок и технических возможностей социальных платформ. Полученные данные визуализированы в форме графиков и диаграмм, что позволяет наглядно проследить баланс между русским и тувинским языками в различных типах сообществ. <br><br>Этот проект вносит вклад в изучение витальности языков коренных народов России в цифровую эпоху и может быть полезен лингвистам, социологам, специалистам по языковой политике и всем, кто интересуется сохранением культурного многообразия в онлайн-пространстве.",
      selectYears: "Выберите годы:",
      dataType: "Тип данных:",
      dataSources: "Источники данных:",

      posts: "Посты",
      comments: "Комментарии",

      community: "Сообщества",
      government: "Госучреждения",
      official: "Официальные СМИ",

      tuvanNgu: "Тувинский (ңөү)",
      tuvanRusKeyboard: "Тувинский (рус. клав.)",
      russian: "Русский",

      chartLineTitle: "Динамика процентного соотношения языков",
      chartBarTitle: "Количество записей по языкам",
      chartStackedTitle: "Распределение по источникам данных",
      chartPieTitle: "Общее распределение по языкам",

      axisPercent: "Процент (%)",
      axisCount: "Количество",
      axisAvgPercent: "Средний процент (%)",

      summaryTitle: "Сводная информация (отфильтрованные данные):",
      totalRecords: "Всего записей",
      average: "средний",

      loading: "Загрузка данных из CSV файлов...",
      error: "Ошибка:",
      noData: "Нет данных для отображения с выбранными фильтрами.",
      noDataHint: "Попробуйте изменить параметры фильтрации.",

      switchLanguage: "Switch to English",
    },
    en: {
      pageTitle:
        "Digital Map of the Language Landscape of the Tuva Republic (2018-2025)",
      aboutProjectTitle: "About the Project",
      aboutProject:
        "This research presents a comprehensive analysis of language practices in the digital space of the Tuva Republic. The study examines 407,000 posts and comments collected via VK API from three types of communities: official government institution groups, regional media outlets, and local community associations.",
      methodologyTitle: "Methodology",
      methodology:
        "The research identifies three main language categories in online communication: <br><br><b>Tuvan language with special characters (ң, ө, ү, Ң, Ө, Ү)</b> — texts preserving authentic Tuvan orthography and reflecting users' commitment to linguistic accuracy. <br><br><b>Tuvan language in Cyrillic</b> — adapted texts without special letters. A heuristic analysis system was developed for their identification, based on recognizing characteristic Tuvan word forms, suffixes, and grammatical patterns, which made it possible to distinguish Tuvan texts from Russian ones within the shared Cyrillic script. <br><br><b>Russian language</b> — texts in the state language of the Russian Federation.",
      significanceTitle: "Significance",
      significance:
        "The research documents the living language situation in the region's digital environment, showing how Tuvan speakers adapt their language to the limitations of keyboard layouts and technical capabilities of social platforms. The collected data is visualized through charts and diagrams, providing clear insights into the balance between Russian and Tuvan languages across different community types. <br><br>This project contributes to the study of indigenous language vitality in Russia's digital age and may be valuable to linguists, sociologists, language policy specialists, and anyone interested in preserving cultural diversity in online spaces.",
      selectYears: "Select years:",
      dataType: "Data type:",
      dataSources: "Data sources:",

      posts: "Posts",
      comments: "Comments",

      community: "Communities",
      government: "Government Institutions",
      official: "Official Media",

      tuvanNgu: "Tuvan (ңөү)",
      tuvanRusKeyboard: "Tuvan (Rus. keyboard)",
      russian: "Russian",

      chartLineTitle: "Language Percentage Dynamics",
      chartBarTitle: "Number of Records by Language",
      chartStackedTitle: "Distribution by Data Source",
      chartPieTitle: "Overall Language Distribution",

      axisPercent: "Percent (%)",
      axisCount: "Count",
      axisAvgPercent: "Average Percent (%)",

      summaryTitle: "Summary Information (filtered data):",
      totalRecords: "Total Records",
      average: "average",

      loading: "Loading data from CSV files...",
      error: "Error:",
      noData: "No data to display with selected filters.",
      noDataHint: "Try changing the filter parameters.",

      switchLanguage: "Переключить на русский",
    },
  };

  constructor() {
    const savedLang = localStorage.getItem("appLanguage") as Language;
    if (savedLang && (savedLang === "ru" || savedLang === "en")) {
      this.currentLanguage$.next(savedLang);
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage$.value;
  }

  getCurrentLanguage$(): Observable<Language> {
    return this.currentLanguage$.asObservable();
  }

  setLanguage(lang: Language): void {
    this.currentLanguage$.next(lang);
    localStorage.setItem("appLanguage", lang);
  }

  toggleLanguage(): void {
    const current = this.getCurrentLanguage();
    const newLang: Language = current === "ru" ? "en" : "ru";
    this.setLanguage(newLang);
  }

  translate(key: keyof Translation): string {
    const lang = this.getCurrentLanguage();
    return this.translations[lang][key];
  }

  getTranslations(): Translation {
    const lang = this.getCurrentLanguage();
    return this.translations[lang];
  }

  translateDataType(type: string): string {
    if (type === "Посты" || type === "Posts") {
      return this.translate("posts");
    }
    if (type === "Комментарии" || type === "Comments") {
      return this.translate("comments");
    }
    return type;
  }

  translateSource(source: "community" | "government" | "official"): string {
    return this.translate(source);
  }
}
