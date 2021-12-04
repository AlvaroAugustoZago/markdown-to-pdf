var express = require('express');
var busboy = require('connect-busboy');
var path = require('path');
var fs = require('fs-extra');
const pdf = require('html-pdf');

var showdown = require('showdown'),
    converter = new showdown.Converter();


var app = express();
app.use(busboy());
app.use(express.static(path.join(__dirname, 'public')));

app.route('/upload')
    .post(function(req, res, next) {

        var fstream;
        req.pipe(req.busboy);
        req.busboy.on('file', function(fieldname, file, filename) {
            var file_name = (new Date().getTime() + '_' + filename).replace(/[^a-z0-9]/gi, '_').toLowerCase();;

            fstream = fs.createWriteStream(__dirname + '/uploads/' + file_name);
            file.pipe(fstream);
            fstream.on('close', function() {
                console.log("Upload Finished of " + file_name);
                generatePDF(__dirname + '/uploads/' + file_name, filename, res);
            });
        });
    });

const generatePDF = (location, originalFileName, res) => {

    const html = converter.makeHtml(fs.readFileSync(location).toString());

    const options = {
        type: 'pdf',
        format: 'A4',
        orientation: 'portrait'
    }

    pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) return res.status(500).json(err)
        fs.writeFileSync(location + ".pdf", buffer, 'utf8');
        res.download(location + ".pdf", originalFileName + '.pdf', function(err) {
            if (err) {
                console.log(err);
            }
            fs.unlink(location + ".pdf");
            fs.unlink(location);
        });

    })
}

var server = app.listen(process.env.PORT || 3030, function() {
    console.log('Listening on port %d', server.address().port);
});