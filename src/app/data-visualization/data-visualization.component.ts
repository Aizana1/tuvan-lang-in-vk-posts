// data-visualization.component.ts
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { CsvDataService, DataRow } from '../services/csv-data.service';
import { TranslationService, Language } from '../services/translation.service';
import { Subject, takeUntil } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-data-visualization',
  templateUrl: './data-visualization.component.html',
  styleUrls: ['./data-visualization.component.css']
})
export class DataVisualizationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('stackedBarChart') stackedBarChartRef!: ElementRef<HTMLCanvasElement>;

  private lineChart?: Chart;
  private barChart?: Chart;
  private pieChart?: Chart;
  private stackedBarChart?: Chart;
  private destroy$ = new Subject<void>();

  // Все данные из CSV
  allData: DataRow[] = [];
  isLoading = true;
  errorMessage = '';

  // Фильтры
  selectedYears: number[] = [];
  selectedTypes: string[] = [];
  selectedSources: DataRow['source'][] = [];

  // Доступные значения для фильтров
  availableYears: number[] = [];
  availableTypes: string[] = [];
  availableSources: Array<{ value: DataRow['source'], label: string }> = [];

  // Текущий язык
  currentLanguage: Language = 'ru';

  constructor(
    private csvDataService: CsvDataService,
    public translationService: TranslationService
  ) {}

  ngOnInit(): void {
    console.log('DataVisualizationComponent ngOnInit called');
    // Подписываемся на изменения языка
    this.translationService.getCurrentLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLanguage = lang;
        this.updateSourceLabels();
        this.updateCharts(); // Обновляем графики при смене языка
      });

    this.currentLanguage = this.translationService.getCurrentLanguage();
    console.log('Loading data...');
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Графики будут созданы после загрузки данных
  }

  /**
   * Переключить язык
   */
  toggleLanguage(): void {
    this.translationService.toggleLanguage();
  }

  /**
   * Обновляет метки источников при смене языка
   */
  updateSourceLabels(): void {
    this.availableSources = [
      { value: 'community', label: this.translationService.translate('community') },
      { value: 'government', label: this.translationService.translate('government') },
      { value: 'official', label: this.translationService.translate('official') }
    ];
  }

  /**
   * Загружает данные из всех CSV файлов
   */
  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    console.log('loadData called, isLoading:', this.isLoading);

    this.csvDataService.loadAllData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Data loaded successfully, count:', data.length);
          this.allData = data;
          this.initializeFilters();
          this.isLoading = false;
          console.log('isLoading set to false');
          
          setTimeout(() => this.updateCharts(), 0);
        },
        error: (error) => {
          console.error('Ошибка загрузки CSV:', error);
          this.errorMessage = this.translationService.translate('error') + ' ' + error.message;
          this.isLoading = false;
        }
      });
  }

  /**
   * Инициализирует фильтры значениями по умолчанию
   */
  initializeFilters(): void {
    this.availableYears = this.csvDataService.getUniqueYears(this.allData);
    this.availableTypes = this.csvDataService.getUniqueTypes(this.allData);
    this.updateSourceLabels();
    
    this.selectedYears = [...this.availableYears];
    this.selectedTypes = [...this.availableTypes];
    this.selectedSources = ['community', 'government', 'official'];
  }

  /**
   * Обработчик изменения чекбокса года
   */
  onYearChange(year: number, event: any): void {
    if (event.target.checked) {
      this.selectedYears.push(year);
    } else {
      this.selectedYears = this.selectedYears.filter(y => y !== year);
    }
    this.selectedYears.sort();
    this.updateCharts();
  }

  /**
   * Обработчик изменения чекбокса типа
   */
  onTypeChange(type: string, event: any): void {
    if (event.target.checked) {
      this.selectedTypes.push(type);
    } else {
      this.selectedTypes = this.selectedTypes.filter(t => t !== type);
    }
    this.updateCharts();
  }

  /**
   * Обработчик изменения чекбокса источника
   */
  onSourceChange(source: DataRow['source'], event: any): void {
    if (event.target.checked) {
      this.selectedSources.push(source);
    } else {
      this.selectedSources = this.selectedSources.filter(s => s !== source);
    }
    this.updateCharts();
  }

  /**
   * Получает отфильтрованные данные
   */
  getFilteredData(): DataRow[] {
    return this.csvDataService.filterData(
      this.allData,
      this.selectedYears,
      this.selectedTypes,
      this.selectedSources
    );
  }

  /**
   * Вычисляет общую сумму total из отфильтрованных данных
   */
  getTotalSum(): number {
    return this.getFilteredData().reduce((sum, row) => sum + row.total, 0);
  }

  /**
   * Вычисляет сумму tuvanNguCol из отфильтрованных данных
   */
  getTuvanNguSum(): number {
    return this.getFilteredData().reduce((sum, row) => sum + row.tuvanNguCol, 0);
  }

  /**
   * Вычисляет средний процент tuvanNguPercent из отфильтрованных данных
   */
  getTuvanNguAvgPercent(): number {
    const data = this.getFilteredData();
    if (data.length === 0) return 0;
    return data.reduce((sum, row) => sum + row.tuvanNguPercent, 0) / data.length;
  }

  /**
   * Вычисляет сумму tuvanRusCol из отфильтрованных данных
   */
  getTuvanRusSum(): number {
    return this.getFilteredData().reduce((sum, row) => sum + row.tuvanRusCol, 0);
  }

  /**
   * Вычисляет средний процент tuvanRusPercent из отфильтрованных данных
   */
  getTuvanRusAvgPercent(): number {
    const data = this.getFilteredData();
    if (data.length === 0) return 0;
    return data.reduce((sum, row) => sum + row.tuvanRusPercent, 0) / data.length;
  }

  /**
   * Вычисляет сумму russianCol из отфильтрованных данных
   */
  getRussianSum(): number {
    return this.getFilteredData().reduce((sum, row) => sum + row.russianCol, 0);
  }

  /**
   * Вычисляет средний процент russianPercent из отфильтрованных данных
   */
  getRussianAvgPercent(): number {
    const data = this.getFilteredData();
    if (data.length === 0) return 0;
    return data.reduce((sum, row) => sum + row.russianPercent, 0) / data.length;
  }

  /**
   * Обновляет все графики
   */
  updateCharts(): void {
    const filteredData = this.getFilteredData();
    
    if (this.lineChartRef) this.updateLineChart(filteredData);
    if (this.barChartRef) this.updateBarChart(filteredData);
    if (this.pieChartRef) this.updatePieChart(filteredData);
    if (this.stackedBarChartRef) this.updateStackedBarChart(filteredData);
  }

  /**
   * График динамики процентного соотношения
   */
  updateLineChart(data: DataRow[]): void {
    if (this.lineChart) {
      this.lineChart.destroy();
    }

    const groupedByYear = data.reduce((acc, row) => {
      if (!acc[row.year]) {
        acc[row.year] = { tuvan: 0, tuvanRus: 0, russian: 0, count: 0 };
      }
      acc[row.year].tuvan += row.tuvanNguPercent;
      acc[row.year].tuvanRus += row.tuvanRusPercent;
      acc[row.year].russian += row.russianPercent;
      acc[row.year].count++;
      return acc;
    }, {} as Record<number, any>);

    const years = Object.keys(groupedByYear).sort();
    const tuvanData = years.map(y => groupedByYear[+y].tuvan / groupedByYear[+y].count);
    const tuvanRusData = years.map(y => groupedByYear[+y].tuvanRus / groupedByYear[+y].count);
    const russianData = years.map(y => groupedByYear[+y].russian / groupedByYear[+y].count);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: this.translationService.translate('tuvanNgu'),
            data: tuvanData,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.4,
            fill: true
          },
          {
            label: this.translationService.translate('tuvanRusKeyboard'),
            data: tuvanRusData,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.4,
            fill: true
          },
          {
            label: this.translationService.translate('russian'),
            data: russianData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.translationService.translate('chartLineTitle'),
            font: { size: 16 }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: this.translationService.translate('axisAvgPercent')
            }
          }
        }
      }
    };

    this.lineChart = new Chart(this.lineChartRef.nativeElement, config);
  }

  /**
   * Столбчатая диаграмма количества по языкам
   */
  updateBarChart(data: DataRow[]): void {
    if (this.barChart) {
      this.barChart.destroy();
    }

    const groupedByYear = data.reduce((acc, row) => {
      if (!acc[row.year]) {
        acc[row.year] = { tuvan: 0, tuvanRus: 0, russian: 0 };
      }
      acc[row.year].tuvan += row.tuvanNguCol;
      acc[row.year].tuvanRus += row.tuvanRusCol;
      acc[row.year].russian += row.russianCol;
      return acc;
    }, {} as Record<number, any>);

    const years = Object.keys(groupedByYear).sort();
    const tuvanData = years.map(y => groupedByYear[+y].tuvan);
    const tuvanRusData = years.map(y => groupedByYear[+y].tuvanRus);
    const russianData = years.map(y => groupedByYear[+y].russian);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            label: this.translationService.translate('tuvanNgu'),
            data: tuvanData,
            backgroundColor: 'rgba(255, 99, 132, 0.8)'
          },
          {
            label: this.translationService.translate('tuvanRusKeyboard'),
            data: tuvanRusData,
            backgroundColor: 'rgba(54, 162, 235, 0.8)'
          },
          {
            label: this.translationService.translate('russian'),
            data: russianData,
            backgroundColor: 'rgba(75, 192, 192, 0.8)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.translationService.translate('chartBarTitle'),
            font: { size: 16 }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: this.translationService.translate('axisCount')
            }
          }
        }
      }
    };

    this.barChart = new Chart(this.barChartRef.nativeElement, config);
  }

  /**
   * Круговая диаграмма общего распределения
   */
  updatePieChart(data: DataRow[]): void {
    if (this.pieChart) {
      this.pieChart.destroy();
    }

    const totals = data.reduce((acc, row) => {
      acc.tuvan += row.tuvanNguCol;
      acc.tuvanRus += row.tuvanRusCol;
      acc.russian += row.russianCol;
      return acc;
    }, { tuvan: 0, tuvanRus: 0, russian: 0 });

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: [
          this.translationService.translate('tuvanNgu'),
          this.translationService.translate('tuvanRusKeyboard'),
          this.translationService.translate('russian')
        ],
        datasets: [{
          data: [totals.tuvan, totals.tuvanRus, totals.russian],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.translationService.translate('chartPieTitle'),
            font: { size: 16 }
          },
          legend: {
            position: 'right'
          }
        }
      }
    };

    this.pieChart = new Chart(this.pieChartRef.nativeElement, config);
  }

  /**
   * Стековая диаграмма по источникам
   */
  updateStackedBarChart(data: DataRow[]): void {
    if (this.stackedBarChart) {
      this.stackedBarChart.destroy();
    }

    const groupedByYearAndSource = data.reduce((acc, row) => {
      const key = `${row.year}-${row.source}`;
      if (!acc[key]) {
        acc[key] = { year: row.year, source: row.source, total: 0 };
      }
      acc[key].total += row.total;
      return acc;
    }, {} as Record<string, any>);

    const years = [...new Set(data.map(r => r.year))].sort();
    const sources = this.selectedSources;

    const datasets = sources.map(source => {
      const sourceLabel = this.translationService.translateSource(source);
      const colors = {
        community: 'rgba(255, 99, 132, 0.8)',
        government: 'rgba(54, 162, 235, 0.8)',
        official: 'rgba(75, 192, 192, 0.8)'
      };

      return {
        label: sourceLabel,
        data: years.map(year => {
          const key = `${year}-${source}`;
          return groupedByYearAndSource[key]?.total || 0;
        }),
        backgroundColor: colors[source]
      };
    });

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: years.map(String),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.translationService.translate('chartStackedTitle'),
            font: { size: 16 }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: this.translationService.translate('axisCount')
            }
          }
        }
      }
    };

    this.stackedBarChart = new Chart(this.stackedBarChartRef.nativeElement, config);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.lineChart) this.lineChart.destroy();
    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.stackedBarChart) this.stackedBarChart.destroy();
  }
}