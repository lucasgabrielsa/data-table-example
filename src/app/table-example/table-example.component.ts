import { HttpClient } from "@angular/common/http";
import { Component, OnInit, ViewChild } from "@angular/core";
import { MatPaginator, MatSort } from "@angular/material";
import { merge, Observable, of as observableOf } from "rxjs";
import { catchError, map, startWith, switchMap } from "rxjs/operators";

/**
 * @title Table retrieving data through HTTP
 */
@Component({
  selector: "table-http-example",
  styleUrls: ["table-example.component.css"],
  templateUrl: "table-example.component.html"
})
export class TableHttpExample implements OnInit {
  displayedColumns: string[] = ["id", "createdAt", "nome", "actions"];
  exampleDatabase: ExampleHttpDao | null;
  data: Livro[] = [];

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  @ViewChild(MatSort)
  sort: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.exampleDatabase = new ExampleHttpDao(this.http);

    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;

          return this.exampleDatabase!.getRepoIssues(
            this.sort.active,
            this.sort.direction,
            this.paginator.pageIndex,
            this.paginator.pageSize
          );
        }),
        map(data => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.isRateLimitReached = false;
          this.resultsLength = data.totalElements;
          this.data = data.content;

          return data.content;
        }),
        catchError(() => {
          this.isLoadingResults = false;
          // Catch if the GitHub API has reached its rate limit. Return empty data.
          this.isRateLimitReached = true;
          return observableOf([]);
        })
      )
      .subscribe(data => {
        //console.log(data);
      });
  }
}

export interface LivroApi {
  content: Livro[];
  totalElements: number;
}

export interface Livro {
  id: number;
  nome: string;
  createdAt: string;
}

/** An example database that the data source uses to retrieve data for the table. */
export class ExampleHttpDao {
  constructor(private http: HttpClient) {}

  getRepoIssues(
    sort: string,
    order: string,
    page: number,
    pageSize: number
  ): Observable<LivroApi> {
    console.log("sort", sort);
    console.log("order", order);
    console.log("page", page);
    console.log("pageSize", pageSize);

    if (!pageSize) {
      pageSize = 3;
    }

    if (!sort) {
      sort = "id";
    }

    if (!order) {
      order = "ASC";
    }

    const href = "http://localhost:5000/api/livro";
    const requestUrl = `${href}?pageNumber=${page}&numberElements=${pageSize}&sort=${sort}&order=${order}`;
    console.log(requestUrl);

    return this.http.get<LivroApi>(requestUrl);
  }
}
