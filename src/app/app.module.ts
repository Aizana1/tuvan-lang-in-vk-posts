import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { DataVisualizationComponent } from './data-visualization/data-visualization.component';
import { CsvDataService } from './services/csv-data.service';
import { TranslationService } from './services/translation.service';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    DataVisualizationComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }