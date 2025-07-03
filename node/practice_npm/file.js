const path = require('path')
const fs = require('fs').promises
const place = path.join(__dirname, 'file.txt')

async function fileOps() {
    try {
        let data = await fs.readFile(place, 'utf-8')
        console.log(data)

        await fs.writeFile(place, 'Namaskar Dosto');
        console.log('Operation completd pahla');

        data = await fs.readFile('./file.txt', 'utf-8')
        console.log(data)

        await fs.appendFile(place,'\nNamaskar Dosto dobara');
        console.log('Operation completd dusara');

        data = await fs.readFile(place, 'utf-8')
        console.log(data)

        await fs.rename(place, path.join(__dirname, 'file_2.txt'));
        console.log("file renamed");

    } catch (err) {
        console.log(err)
    }
}

fileOps().then(() => {
    console.log('Exited form function fileOps()')
});