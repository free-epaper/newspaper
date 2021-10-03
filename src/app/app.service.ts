import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


export interface DownloadResponse {
  
    status: Boolean,
    message: String,
    EmailId: String,
    UserName: String,
    UserId: Number,
    flag: Number,
    Email: String,
    is_first_visit: Number,
    Info: Number,
    SessionId: String,
    FileContent: String,
    FileName: String,
    IsBlocked: Boolean,
    HaveState: Boolean,
    HaveMobNo: Number,
    stateid: Number,
    stringdate: String,
    InvoiceNumber: String,
    Body: String,
    IsPrompt: Boolean,
    SuplementPdf: String

}

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }
 

  downloadHT(id, fullDate) {
    let date = ('0' + fullDate.getDate()).slice(-2);
    let month = ('0' + (fullDate.getMonth()+1)).slice(-2);
    let year = ''+fullDate.getFullYear();
    var dateString = ""+ date + "%2F"+ month + "%2F"+year;
    //https://epaper.livehindustan.com/Home/Download?id=125&type=5&EditionId=125&Date=20/09/2021
    var url = "https://epaper.hindustantimes.com/Home/Download?id="+id+"&type="+ 5 + "&EditionId="+id+"&Date=" + dateString;
    // console.log(url);

    return this.http.get(url, {headers: new HttpHeaders({'Content-Type': 'application/json; charset=utf8'})});
  }

  public getPDF(url): Observable<Blob> {   
    return this.http.get(url, { responseType: 'blob'});
  }
}
