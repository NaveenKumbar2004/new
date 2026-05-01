

async function testFetch() {
    try {
        const payload = {
            slot_id: 'A1',
            vehicle_id: '1',
            date: '2026-04-29',
            start_time: '10:00',
            end_time: '12:00',
            total_cost: '10.00'
        };

        const res = await fetch('http://localhost:3000/api/book-slot', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-id': '1'
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        console.log("Response:", result);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testFetch();
