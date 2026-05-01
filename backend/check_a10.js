const mysql = require('mysql2/promise');

async function check() {
    const c = await mysql.createConnection({host:'localhost',user:'root',password:'Nave@2004',database:'smart_parking'});
    const [rows] = await c.query('SELECT * FROM ParkingSlots WHERE id="A10"');
    console.log(rows);
    await c.end();
}
check();
