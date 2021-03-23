import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import {
  MAT_MOMENT_DATE_FORMATS,
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { Router } from '@angular/router';

import { AppService, DownloadResponse } from './app.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
  ]
})
export class AppComponent {
  minDate: Date;
  maxDate: Date;
  url: String;
  zoom = '140%';
  title = 'newspaper';
  readingMode = false;
  newspaperForm = undefined;
  isLoading = false;
  errorMessage = "NEWSPAPER NOT FOUND/PUBLISHED";
  public enablePinchOnMobile = true;
  public zoomLevels = ['auto', 'page-actual', 'page-fit', 'page-width',
    0.2, 0.25, 0.33, 0.5, 0.67, 0.75, 0.82, 0.9, 1, 1.1, 1.15,
    1.25, 1.5, 1.66, 1.8, 2, 2.5, 3, 3.5, 4];

  constructor(private fb: FormBuilder, private router: Router, private appservie: AppService,
    public dateAdapter: DateAdapter<any>, private _snackBar: MatSnackBar) {
    this.newspaperForm = this.fb.group({
      edition: ['', Validators.required],
      date: ['', Validators.required],
    });
    this.newspaperForm.controls['date'].setValue(new Date());
    this.minDate = new Date();
    this.maxDate = new Date();
    this.minDate.setDate(this.minDate.getDate() - 59);
    this.dateAdapter.setLocale('hi');
  }

  holidays = [
    // { date: 17, month: 9 }, // 17th sept: Vishwakarma Puja
    { date: 15, month: 8 }, // 15 Aug
    { date: 26, month: 1 }, // 26 Jan
    { date: 2, month: 10 },  // 02 Oct
    { date: 1, month: 5 } // labour day
  ]

  readTries = 0;
  downloadTries = 0;


  htIDs = {
    51: "patna",
    1: "delhi",
    58: "ranchi",
    54: "pune",
    64: "westup",
    46: "mumbai",
    65: "uttarakhand"
  }

  DateFilterFn = (date: Date | null) => {
    for (var i = 0; i < this.holidays.length; i++) {
      if (date.getMonth() == this.holidays[i].month - 1 && date.getDate() == this.holidays[i].date + 1) return false;
    }
    return true;
  }


  tabClick(event: MatTabChangeEvent) {
    this.newspaperForm.reset();
    const tab = event.tab.textLabel;
    if (tab === "हिन्दुस्तान") {
      this.dateAdapter.setLocale('hi');
    } else {
      this.dateAdapter.setLocale('en-in');
    }
  }

  getUrl() {
    let edition = this.newspaperForm.value.edition;
    var fullDate = this.newspaperForm.value.date;
    let date = ('0' + fullDate.getDate()).slice(-2);
    let month = ('0' + (fullDate.getMonth() + 1)).slice(-2);
    let year = '' + fullDate.getFullYear();
    fullDate = date + month + year;
    let url = "https://epaper.livehindustan.com/downloadPdf.php?filepath=epaperimages/" + fullDate + "/" + fullDate + "-" + edition + ".pdf&filename=" + fullDate + "-" + edition + ".pdf";
    return url;
  }

  read() {
    this.readingMode = false;
    this.isLoading = true;

    this.appservie.getPDF(this.getUrl())
      .subscribe(x => {
        var check = new Blob([x], { type: "text/plain" });
        const reader = new FileReader();
        reader.addEventListener('loadend', (e) => {


          // window.location.href = url;

          var newBlob = new Blob([x], { type: "application/pdf" });

          // IE doesn't allow using a blob object directly as link href
          // instead it is necessary to use msSaveOrOpenBlob
          // if (window.navigator && window.navigator.msSaveOrOpenBlob) {
          //   window.navigator.msSaveOrOpenBlob(newBlob);
          //   return;
          // }

          // For other browsers: 
          // Create a link pointing to the ObjectURL containing the blob.
          if (newBlob.size == 0) {
            this._snackBar.open(this.errorMessage, "OK", {
              duration: 4000,
            });
            this.readingMode = false;
            this.isLoading = false;
            return;
          }
          const data = window.URL.createObjectURL(newBlob);

          var link = document.createElement('a');
          link.href = data;
          this.url = data;
          this.isLoading = false;
          this.readingMode = true;



        });
        reader.readAsText(x);

        // It is necessary to create a new blob object with mime-type explicitly set
        // otherwise only Chrome works like it should

      }, error=> {
        // console.log(error);
        this.isLoading = false;
        this.readingMode = false;
            this._snackBar.open(this.errorMessage, "OK", {
              duration: 4000,
            });
            return;
      });
  }




  readHT() {
    this.readingMode = false;
    this.isLoading = true;
    if (this.readTries > 100) {
      this.readTries = 0;
      this.isLoading = false;
      this._snackBar.open(this.errorMessage, "OK", {
        duration: 4000,
      });
      return;
    }
    this.readTries += 1;

    this.appservie.downloadHT(this.newspaperForm.value.edition, this.newspaperForm.value.date).subscribe(data => {
      var name = "HT" + this.htIDs[this.newspaperForm.value.edition] + "-" + this.newspaperForm.value.date.getDate() + "-" + (this.newspaperForm.value.date.getMonth() + 1);
      var downloadResponse = data as DownloadResponse;
      // console.log(data);
      var fileName = downloadResponse.FileName;
      var url = "https://epaper.hindustantimes.com/Home/Download?Filename=" + fileName;
      // this.url = url;
      this.appservie.getPDF(url)
        .subscribe(x => {
          var check = new Blob([x], { type: "text/plain" });
          const reader = new FileReader();
          reader.addEventListener('loadend', (e) => {
            const text = e.srcElement["result"];
            // console.log(text);

            if (text == '"Link expire, please try again"') {

              this.readHT();
              return;
            } else {
              this.readTries = 0;

              // window.location.href = url;

              var newBlob = new Blob([x], { type: "application/pdf" });

              // IE doesn't allow using a blob object directly as link href
              // instead it is necessary to use msSaveOrOpenBlob
              // if (window.navigator && window.navigator.msSaveOrOpenBlob) {
              //   window.navigator.msSaveOrOpenBlob(newBlob);
              //   return;
              // }

              // For other browsers: 
              // Create a link pointing to the ObjectURL containing the blob.
              const data = window.URL.createObjectURL(newBlob);

              var link = document.createElement('a');
              link.href = data;
              this.url = data;
              this.isLoading = false;
              this.readingMode = true;

            }
          });
          reader.readAsText(x);

          // It is necessary to create a new blob object with mime-type explicitly set
          // otherwise only Chrome works like it should

        });
    }, error=> {
      // console.log(error);
      this.isLoading = false;
      this.readingMode = false;
          this._snackBar.open(this.errorMessage, "OK", {
            duration: 4000,
          });
          return;
    });
  }

  downloadHT() {
    this.readingMode = false;
    this.isLoading = true;
    if (this.downloadTries > 100) {
      this.downloadTries = 0;
      this.isLoading = false;
      this._snackBar.open(this.errorMessage, "OK", {
        duration: 4000,
      });
      return;
    }
    this.downloadTries += 1;


    this.appservie.downloadHT(this.newspaperForm.value.edition, this.newspaperForm.value.date).subscribe(data => {
      var name = "HT" + this.htIDs[this.newspaperForm.value.edition] + "-" + this.newspaperForm.value.date.getDate() + "-" + (this.newspaperForm.value.date.getMonth() + 1);
      var downloadResponse = data as DownloadResponse;
      // console.log(data);
      var fileName = downloadResponse.FileName;
      var url = "https://epaper.hindustantimes.com/Home/Download?Filename=" + fileName;
      this.url = url;
      this.appservie.getPDF(url)
        .subscribe(x => {
          var check = new Blob([x], { type: "text/plain" });
          const reader = new FileReader();
          reader.addEventListener('loadend', (e) => {
            const text = e.srcElement["result"];
            // console.log(text);

            if (text == '"Link expire, please try again"') {
              this.downloadHT();
              return;
            } else {
              // window.location.href = url;
              this.downloadTries = 0;
              var newBlob = new Blob([x], { type: "application/pdf" });

              // IE doesn't allow using a blob object directly as link href
              // instead it is necessary to use msSaveOrOpenBlob
              if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(newBlob);
                return;
              }

              // For other browsers: 
              // Create a link pointing to the ObjectURL containing the blob.
              const data = window.URL.createObjectURL(newBlob);

              var link = document.createElement('a');
              link.href = data;
              link.download = name + ".pdf";
              // this is necessary as link.click() does not work on the latest firefox
              link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

              setTimeout(function () {
                // For Firefox it is necessary to delay revoking the ObjectURL
                window.URL.revokeObjectURL(data);
                link.remove();
              }, 100);
              this.isLoading = false;
              this._snackBar.open("DOWNLOADING...", "OK", {
                duration: 2000,
              });

            }
          });
          reader.readAsText(x);

          // It is necessary to create a new blob object with mime-type explicitly set
          // otherwise only Chrome works like it should

        });
    },error=> {
      // console.log(error);
      this.isLoading = false;
      this.readingMode = false;
          this._snackBar.open(this.errorMessage, "OK", {
            duration: 4000,
          });
          return;
    });

  }

  // download() {
  //   this.readingMode = false;
  //   var url = this.getUrl();
  //   window.location.href = url;

  // }

  download() {
   var name = "Hindustan" + this.newspaperForm.value.edition + "-" + this.newspaperForm.value.date.getDate() + "-" + (this.newspaperForm.value.date.getMonth() + 1);
   this.isLoading = true;
    this.readingMode = false;
    this.appservie.getPDF(this.getUrl())
      .subscribe(x => {
        const reader = new FileReader();
        reader.addEventListener('loadend', (e) => {

          // window.location.href = url;
          this.downloadTries = 0;
          var newBlob = new Blob([x], { type: "application/pdf" });

          if (newBlob.size == 0) {
            this.isLoading = false;
            this._snackBar.open(this.errorMessage, "OK", {
              duration: 4000,
            });
            return;
          }
          // IE doesn't allow using a blob object directly as link href
          // instead it is necessary to use msSaveOrOpenBlob
          if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(newBlob);
            return;
          }

          // For other browsers: 
          // Create a link pointing to the ObjectURL containing the blob.
          const data = window.URL.createObjectURL(newBlob);

          var link = document.createElement('a');
          link.href = data;
          link.download = name + ".pdf";
          // this is necessary as link.click() does not work on the latest firefox
          link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

          setTimeout(function () {
            // For Firefox it is necessary to delay revoking the ObjectURL
            window.URL.revokeObjectURL(data);
            link.remove();
          }, 100);
          this._snackBar.open("DOWNLOADING...", "OK", {
            duration: 2000,
          });
          this.isLoading = false;

        });
        reader.readAsText(x);

      }, error=> {
        // console.log(error);
        this.isLoading = false;
            this._snackBar.open(this.errorMessage, "OK", {
              duration: 4000,
            });
            return;
      });
  }


}
