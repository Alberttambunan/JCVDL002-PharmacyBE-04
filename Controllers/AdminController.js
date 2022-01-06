const util = require('util');
const { db } = require('../Database/Connection');
const query = util.promisify(db.query).bind(db);

const singleUpload = require('../Helpers/multerSingle');
const deleteFiles = require('../Helpers/deleteFiles');
const singleUploadAwait = util.promisify(singleUpload).bind(singleUpload);

const express = require('express');
const app = express();
app.use('/Public', express.static('storage'));

module.exports = {
    addProduct: async (req, res) => {
        let data = req.body;
        console.log(data);
        let dataParsed = JSON.parse(data);
        console.log([dataParsed]);

        let insertDataQuery = 'INSERT INTO addresses SET ?';
        let insertImgQuery = 'UPDATE products SET `Image` = ? WHERE (`ID` = ?)';

        let FilePathLocation;

        try {
            await singleUploadAwait(req, res);
            if (req.files.length === 0 || req.files === undefined) throw { message: 'File Not Found' };
            FilePathLocation = 'http://localhost:2004/' + req.files[0].path;

            await query('Start Transaction');

            const insertData = await query(insertDataQuery, dataParsed)
                .catch((err) => {
                    console.log(err);
                    throw err;
                });

            const insertImg = await query(insertImgQuery, [FilePathLocation, insertData.insertId])
                .catch((err) => {
                    console.log(err);
                    throw err;
                });

            await query('Commit');
            console.log('berhasil commit data product');
            res.status(200).send({
                error: false,
                message: 'Update Product Success',
                detail: 'Product now available in database'
            });

        } catch (err) {
            await query('Rollback');
            if (err.status) {
                res.status(err.status).send({
                    error: true,
                    message: err.message,
                    detail: err.detail
                });
            } else {
                res.status(500).send({
                    error: true,
                    message: err.message
                });
            }
        }
    }
};