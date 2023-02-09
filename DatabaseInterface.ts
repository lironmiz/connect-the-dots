class DatabaseInterface {
    constructor() {
        this.db = new sqlite3.Database(
            "./DB_Interface.db",
            sqlite3.OPEN_READWRITE,
            (err) => {
                if (err) return console.error(err.message);
            }
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

    updateDownloadCount(id) {
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

    uploadImage(path) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO Images(upload_date, path) VALUES(datetime('now'),?)`,
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

    getImages(page, order) {
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM Images ORDER BY`;
            switch (order) {
                case "newest":
                    query += ` upload_date DESC`;
                    break;
                case "oldest":
                    query += ` upload_date ASC`;
                    break;
                case "most_downloads":
                    query += ` downloads DESC`;
                    break;
            }
            const itemsPerPage = 4;
            query += ` LIMIT ${(page - 1) * itemsPerPage}, ${itemsPerPage}`;

            this.db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    getNumberOfPages() {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT COUNT(*) FROM Images`, (err, row) => {
                if (err) {
                    reject(err);
                }
                const totalItems = row["COUNT(*)"];
                const itemsPerPage = 4;
                const numberOfPages = Math.ceil(totalItems / itemsPerPage);
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
}

module.exports = Database;
