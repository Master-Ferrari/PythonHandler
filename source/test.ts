import { PythonCommunicator } from "./index";

const pyCom = new PythonCommunicator("python/test.py", {
    pythonPronoun: "python3"
});

pyCom.send("Hello, World!");

let i  = 0;
setInterval(() => {
    pyCom.send("Hello again! " + i++);
}, 1000);