import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Ambil semua pembalap
        if (req.method === 'GET') {
            const result = await sql`
                SELECT id, name, created_at 
                FROM racers 
                ORDER BY id ASC
            `;
            return res.status(200).json(result.rows);
        }

        // POST - Tambah pembalap
        if (req.method === 'POST') {
            const { name } = req.body;
            if (!name || name.trim() === '') {
                return res.status(400).json({ error: 'Nama pembalap wajib diisi' });
            }
            const result = await sql`
                INSERT INTO racers (name) 
                VALUES (${name.trim()}) 
                RETURNING id, name
            `;
            return res.status(201).json(result.rows[0]);
        }

        // PUT - Edit pembalap
        if (req.method === 'PUT') {
            const { id, name } = req.body;
            if (!id || !name) {
                return res.status(400).json({ error: 'ID dan nama wajib diisi' });
            }
            await sql`
                UPDATE racers 
                SET name = ${name.trim()} 
                WHERE id = ${id}
            `;
            return res.status(200).json({ message: 'Berhasil diupdate' });
        }

        // DELETE - Hapus pembalap
        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: 'ID wajib diisi' });
            }
            // Hapus juga relasi di matches
            await sql`DELETE FROM matches WHERE racer1_id = ${id} OR racer2_id = ${id}`;
            await sql`DELETE FROM racers WHERE id = ${id}`;
            return res.status(200).json({ message: 'Berhasil dihapus' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
