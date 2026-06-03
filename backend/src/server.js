import express from "express";
import cors from "cors";
import {exec, spawn} from "node:child_process"
import { promisify } from 'node:util'
import {once} from "node:events"

const app = express();
app.use(express.json());
app.use(cors())
const execAsync = promisify(exec);

app.post('/api/response', async (req, res) => {
    const {code} = req.body;

    const { stdout, stderr } = await execAsync(`node -e '${code}'`);

        if (stderr) {
            return res.json({ error: stderr });
        }

        return res.json({ output: stdout });

    res.json({output})
})



app.listen(3000, () => 
{
    console.log(`App is running at http://localhost:3000`)
})