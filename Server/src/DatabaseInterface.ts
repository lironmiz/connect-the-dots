import { Database } from 'sqlite3';

interface ImageData {
    id: number,
    upload_date: string,
    downloads: number,
    path: string
}

const IMAGES_PER_PAGE = 4;

export class DatabaseInterface {
    private db: Database;
    private orderQueries: Record<string, string> = {
        'newest': 'upload_date DESC',
        'oldest': 'upload_date ASC',
        'popular': 'downloads DESC'
    }

    constructor() {
        this.db = new Database(
            "./images.sqlite",
            (err) => { if(err) console.log("CAN'T OPEN DB: " + err.message); }
        );
        this.createTable();
    }

    createTable() {
        this.db.run(
            `CREATE TABLE IF NOT EXISTS Images(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                upload_date DATE NOT NULL,
                downloads INT NOT NULL DEFAULT 0,
                path TEXT NOT NULL
            )`
        );
    }

    updateDownloadCount(id: number) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE Images SET downloads = downloads + 1 WHERE id = ?`,
                id,
                (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(true);
                }
            );
        });
    }

    uploadImage(path: string) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO Images(upload_date, path) VALUES(datetime('now'), ?)`,
                path,
                (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(true);
                }
            );
        });
    }

    getImages(page: number, orderby: string) : Promise<ImageData[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM Images ORDER BY ${this.orderQueries[orderby] ?? this.orderQueries.newest} LIMIT ?, ?`,
                [
                    (page - 1) * IMAGES_PER_PAGE, 
                    IMAGES_PER_PAGE
                ], 
                (err, rows) => {
                    if (err)
                        reject(err);
                    resolve(rows);
                }
            );
        });
    }

    getNumberOfPages() : Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT COUNT(*) FROM Images`, (err, row) => {
                if (err) {
                    reject(err);
                }
                const totalItems = row["COUNT(*)"];
                const numberOfPages = Math.ceil(totalItems / IMAGES_PER_PAGE);
                resolve(numberOfPages);
            });
        });
    }

    getNumberOfImages() {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT COUNT(*) FROM Images`, (err, row) => {
                if (err) {
                    reject(err);
                }
                resolve(row["COUNT(*)"]);
            });
        });
    }

    idExists(id: number) : Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT COUNT(*) FROM Images WHERE id=?`, id, (err, row) => {
                if (err)
                    resolve(false);
                resolve(row["COUNT(*)"] == 1);
            });
        });
    }
}
