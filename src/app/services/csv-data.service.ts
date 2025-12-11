// csv-data.service.ts
import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Observable, forkJoin, map } from 'rxjs';
import * as Papa from 'papaparse';

export interface DataRow {
  year: number;
  type: string;
  total: number;
  tuvanNguCol: number;
  tuvanNguPercent: number;
  tuvanRusCol: number;
  tuvanRusPercent: number;
  russianCol: number;
  russianPercent: number;
  source: 'community' | 'government' | 'official'; // Источник данных
}

interface CsvRow {
  Год: string;
  Тип: string;
  Всего: string;
  Тувинский_ңөү_кол: string;
  'Тувинский_ңөү_%': string;
  Тувинский_рус_клав_кол: string;
  'Тувинский_рус_клав_%': string;
  Русский_кол: string;
  'Русский_%': string;
}

@Injectable({
  providedIn: 'root'
})
export class CsvDataService {
  private readonly basePath: string;

  private readonly CSV_FILES = [
    { path: 'dataset/results/results_community_media_posts.csv', source: 'community' as const },
    { path: 'dataset/results/results_gov_institutions_posts.csv', source: 'government' as const },
    { path: 'dataset/results/results_official_media_posts.csv', source: 'official' as const }
  ];

  constructor(
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document
  ) {
    // Получаем base href из документа
    const baseElement = this.document.querySelector('base');
    this.basePath = baseElement?.getAttribute('href') || '/';
  }

  private getFullPath(relativePath: string): string {
    // Нормализуем basePath - убираем завершающий слэш, если есть
    const base = this.basePath.endsWith('/') ? this.basePath.slice(0, -1) : this.basePath;
    // Убираем ведущий '/' из relativePath, если есть
    const path = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    // Собираем полный путь
    return base === '/' ? `/${path}` : `${base}/${path}`;
  }

  /**
   * Загружает все CSV файлы и преобразует их в единый массив DataRow
   */
  loadAllData(): Observable<DataRow[]> {
    const requests = this.CSV_FILES.map(file =>
      this.loadCsvFile(this.getFullPath(file.path), file.source)
    );

    return forkJoin(requests).pipe(
      map(results => results.flat())
    );
  }

  /**
   * Загружает один CSV файл
   */
  private loadCsvFile(path: string, source: DataRow['source']): Observable<DataRow[]> {
    return this.http.get(path, { responseType: 'text' }).pipe(
      map(csvText => this.parseCsv(csvText, source))
    );
  }

  /**
   * Парсит CSV текст в массив DataRow
   */
  private parseCsv(csvText: string, source: DataRow['source']): DataRow[] {
    const parseResult = Papa.parse<CsvRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });

    if (parseResult.errors.length > 0) {
      console.error(`Ошибки при парсинге CSV (${source}):`, parseResult.errors);
    }

    return parseResult.data.map(row => this.transformRow(row, source));
  }

  /**
   * Преобразует строку CSV в объект DataRow
   */
  private transformRow(row: CsvRow, source: DataRow['source']): DataRow {
    return {
      year: parseInt(row.Год, 10),
      type: row.Тип,
      total: parseInt(row.Всего, 10),
      tuvanNguCol: parseInt(row.Тувинский_ңөү_кол, 10),
      tuvanNguPercent: parseFloat(row['Тувинский_ңөү_%']),
      tuvanRusCol: parseInt(row.Тувинский_рус_клав_кол, 10),
      tuvanRusPercent: parseFloat(row['Тувинский_рус_клав_%']),
      russianCol: parseInt(row.Русский_кол, 10),
      russianPercent: parseFloat(row['Русский_%']),
      source
    };
  }

  /**
   * Получает список доступных источников данных
   */
  getAvailableSources(): Array<{ value: DataRow['source'], label: string }> {
    return [
      { value: 'community', label: 'Сообщества' },
      { value: 'government', label: 'Госучреждения' },
      { value: 'official', label: 'Официальные СМИ' }
    ];
  }

  /**
   * Фильтрует данные по различным параметрам
   */
  filterData(
    data: DataRow[],
    years: number[],
    types: string[],
    sources: DataRow['source'][]
  ): DataRow[] {
    return data.filter(row => {
      const yearMatch = years.length === 0 || years.includes(row.year);
      const typeMatch = types.length === 0 || types.includes(row.type);
      const sourceMatch = sources.length === 0 || sources.includes(row.source);
      return yearMatch && typeMatch && sourceMatch;
    });
  }

  /**
   * Получает уникальные года из данных
   */
  getUniqueYears(data: DataRow[]): number[] {
    return [...new Set(data.map(row => row.year))].sort();
  }

  /**
   * Получает уникальные типы из данных
   */
  getUniqueTypes(data: DataRow[]): string[] {
    return [...new Set(data.map(row => row.type))].sort();
  }
}