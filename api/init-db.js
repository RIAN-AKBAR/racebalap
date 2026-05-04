import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    // Hanya bisa dijalankan dengan secret key untuk keamanan
    const { secret } = req.query;
    if (secret !== 'YOUR_SECRET_KEY_HERE') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Buat tabel racers
        await sql`
            CREATE TABLE IF NOT EXISTS racers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Buat tabel matches
        await sql`
            CREATE TABLE IF NOT EXISTS matches (
                id SERIAL PRIMARY KEY,
                racer1_id INTEGER NOT NULL REFERENCES racers(id) ON DELETE CASCADE,
                racer2_id INTEGER NOT NULL REFERENCES racers(id) ON DELETE CASCADE,
                winner VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        return res.status(200).json({ message: 'Database berhasil diinisialisasi!' });
    } catch (error) {
        console.error('Init DB Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
