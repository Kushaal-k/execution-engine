import express from "express";
import cors from "cors";
import {spawn} from "node:child_process";
import {once} from "node:events"
import {promises as fs} from "node:fs"

const app = express();

app.use(express.json());
app.use(cors())

const options = {
    cwd: "/home/kushaal/projects/Execution-Engine/backend/temp"
}

app.post('/api/response', async (req, res) => {
    const {code, language} = req.body;

    let fileName = 'main';
    let runCommand = '';

    if(language.toLowerCase() === "javascript") {
        fileName += ".js";
        runCommand = "node"
    }
    else if(language.toLowerCase() === "python"){
        fileName += ".py"
        runCommand = "python3"
    }
    else if(language.toLowerCase() === "c++"){
        fileName += ".cpp"
        runCommand = ""
    }
    
    try {
        await fs.writeFile(`${options.cwd}/${fileName}`, code)
        
        const output = spawn(`${runCommand}`, [`${options.cwd}/${fileName}`], options)

        let stdout = "";
        let stderr = "";

        output.stdout.on("data", data => {
            stdout += data.toString();
        });

        output.stderr.on("data", data => {
            stderr += data.toString();
        });

        const [exitCode] = await once(output, "close");

        res.json({
            output: stdout,
            error: stderr,
            exitCode
        });
    } 
    catch (error) {
        res.status(200).json({error: "Error while processing code!"})
    }
    finally {
        try {
            await fs.unlink(`${options.cwd}/${fileName}`);
            console.log("File deleted successfully!")
        } catch (error) {
            console.error("Failed to delete temp file: ", error)
        }
    }

    
})



app.listen(3000, () => {
    console.log(`App is running at http://localhost:3000`)
})