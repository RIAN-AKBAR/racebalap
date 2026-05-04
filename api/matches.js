import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Ambil semua pertandingan
        if (req.method === 'GET') {
            const result = await sql`
                SELECT 
                    m.id, 
                    m.racer1_id, 
                    m.racer2_id, 
                    m.winner,
                    r1.name as racer1_name,
                    r2.name as racer2_name
                FROM matches m
                JOIN racers r1 ON m.racer1_id = r1.id
                JOIN racers r2 ON m.racer2_id = r2.id
                ORDER BY m.id ASC
            `;
            return res.status(200).json(result.rows);
        }

        // POST - Generate otomatis (semua kombinasi)
        if (req.method === 'POST' && req.url === '/api/matches/generate') {
            // Ambil semua pembalap
            const racers = await sql`SELECT id FROM racers ORDER BY id`;
            const racerIds = racers.rows.map(r => r.id);
            
            // Hapus matches lama
            await sql`DELETE FROM matches`;
            
            // Buat kombinasi baru (setiap pasangan unik)
            for (let i = 0; i < racerIds.length; i++) {
                for (let j = i + 1; j < racerIds.length; j++) {
                    await sql`
                        INSERT INTO matches (racer1_id, racer2_id, winner) 
                        VALUES (${racerIds[i]}, ${racerIds[j]}, NULL)
                    `;
                }
            }
            
            return res.status(201).json({ message: 'Race berhasil digenerate' });
        }

        // POST - Tambah match manual (jika diperlukan)
        if (req.method === 'POST') {
            const { racer1_id, racer2_id } = req.body;
            await sql`
                INSERT INTO matches (racer1_id, racer2_id, winner) 
                VALUES (${racer1_id}, ${racer2_id}, NULL)
            `;
            return res.status(201).json({ message: 'Race ditambahkan' });
        }

        // PUT - Update pemenang
        if (req.method === 'PUT') {
            const { id, winner } = req.body;
            await sql`
                UPDATE matches 
                SET winner = ${winner} 
                WHERE id = ${id}
            `;
            return res.status(200).json({ message: 'Pemenang diupdate' });
        }

        // DELETE - Hapus match (semua atau satu)
        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (id) {
                await sql`DELETE FROM matches WHERE id = ${id}`;
            } else {
                await sql`DELETE FROM matches`;
            }
            return res.status(200).json({ message: 'Berhasil dihapus' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
