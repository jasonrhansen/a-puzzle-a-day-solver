import './style.scss';

// Note that a dynamic `import` statement here is required due to
// webpack/webpack#6615, but in theory `import { greet } from './pkg';`
// will work here one day as well!
const rust = import('../public/pkg/index');

const HINT_ID: string = "hint";
const BOARD_TABLES_ID: string = "board-tables";
const MONTH_FORM_ID: string = "month-form";
const DAY_FORM_ID: string = "day-form";
const WEEKDAY_FORM_ID: string = "weekday-form";
const PUZZLE_TYPE_FORM_ID: string = "puzzle-type-form";
const SOLVE_BUTTON_ID: string = "solve-button";
const SOLUTION_COUNT_ID: string = "solution-count";

enum PuzzleType {
    DragonFjord,
    JarringWords,
    Tetromino,
    WeekDay
}

function buttonOnClick() {
    const m_form =<HTMLSelectElement>document.getElementById(MONTH_FORM_ID);
    const month = m_form.selectedIndex + 1;
    const d_form =<HTMLSelectElement>document.getElementById(DAY_FORM_ID);
    const day = d_form.selectedIndex + 1;
    const w_form =<HTMLSelectElement>document.getElementById(WEEKDAY_FORM_ID);
    const weekday = w_form.selectedIndex;
    const p_form =<HTMLSelectElement>document.getElementById(PUZZLE_TYPE_FORM_ID);
    const puzzle_type = p_form.selectedIndex;

    resetBoard();

    callSolver(month, day, weekday, puzzle_type).then(results => {
        console.log(results);
        renderTables(month, day, weekday, results);
    })
}

function resetBoard() {
    let hint = document.getElementById(HINT_ID);
    hint.innerText = "";
}

async function callSolver(month: number, day: number, weekday: number, puzzle_type: PuzzleType): Promise<string[]> {
    if (!(1 <= month && month <= 12 && 1 <= day && day <= 31 && 0 <= weekday && weekday < 7)) {

        throw new Error("Error: invalid date: " + month + ", " + day);
    }

    // If there is a solution without flipping, return it.
    let r = await rust.then(m => {
        return m.find_solutions(month, day, weekday, puzzle_type, false /* allow_flip */);
    });
    if (r.length > 0) {
        return r;
    }

    let hint = document.getElementById(HINT_ID);
    hint.innerText = "(No solution without flipping pieces.)";

    return await rust.then(m => {
        return m.find_solutions(month, day, weekday, puzzle_type, true);
    });
}

function addOptions() {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();

    const m_form =<HTMLSelectElement>document.getElementById(MONTH_FORM_ID);
    months.forEach(m => {
        const opt = document.createElement("option");
        opt.text = m;
        m_form.add(opt);
    });
    m_form.selectedIndex = today.getMonth();

    const d_form =<HTMLSelectElement>document.getElementById(DAY_FORM_ID);
    for (let i = 1; i <= 31; i++) {
        const opt = document.createElement("option");
        opt.text = i.toString();
        d_form.add(opt);
    }
    d_form.selectedIndex = today.getDate() - 1;

    const w_form =<HTMLSelectElement>document.getElementById(WEEKDAY_FORM_ID);
    weekdays.forEach(w => {
        const opt = document.createElement("option");
        opt.text = w;
        w_form.add(opt);
    });
    w_form.selectedIndex = today.getDay();
    w_form.disabled = true;

    const p_form =<HTMLSelectElement>document.getElementById(PUZZLE_TYPE_FORM_ID);
    ["DragonFjord's A-Puzzle-A-Day", "JarringWords's Calendar Puzzle", "Tetromino-type Calendar Puzzle", "WeekDay Calendar Puzzle"].forEach(typ => {
        const opt = document.createElement("option");
        opt.text = typ;
        p_form.add(opt);
    });
    p_form.selectedIndex = 0;
}

function onChangePuzzleType() {
    const p_form =<HTMLSelectElement>document.getElementById(PUZZLE_TYPE_FORM_ID);
    const w_form =<HTMLSelectElement>document.getElementById(WEEKDAY_FORM_ID);
    if (p_form.selectedIndex == PuzzleType.WeekDay) {
        w_form.disabled = false;
    } else {
        w_form.disabled = true;
    }
}

function renderTables(month: number, day: number, weekday: number, board_strs: string[]) {
    const HEIGHT = 8;
    const WIDTH = 7;
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const COLOR_DICT = {
        "0": "crimson",
        "1": "pink",
        "2": "indigo",
        "3": "cyan",
        "4": "teal",
        "5": "green",
        "6": "palegoldenrod",
        "7": "orange",
        "8": "gray",
        "M": "tan",
        "D": "tan",
        "#": "white",
    };

    const solutionCountDiv = <HTMLDivElement>document.getElementById(SOLUTION_COUNT_ID);
    solutionCountDiv.innerText = `This puzzle has ${board_strs.length.toString()} solutions`;

    const tablesDiv = <HTMLDivElement>document.getElementById(BOARD_TABLES_ID);
    tablesDiv.innerText = "";

    board_strs.forEach((board_str) => {
        const table = tablesDiv.appendChild(document.createElement("table"));
        table.className = "board-table";
        let board = [];
        for (const l of board_str.trim().split("\n")) {
            const cs = l.trim().split(" ");
            if (cs.length != WIDTH) {
                console.log("unexpected board width: ", cs);
            }
            board.push(cs);
        }
        if (board.length != HEIGHT) {
            console.log("unexpected board height: ", board.length, board);
        }

        for (let i = 0; i < HEIGHT; i++) {
            let row = <HTMLTableRowElement>table.insertRow(i);
            for (let j = 0; j < WIDTH; j++) {
                let cell = row.insertCell(j);
                let div = document.createElement("div");
                div.className = "cell";
                let color = COLOR_DICT[board[i][j]];
                div.style.backgroundColor = color;

                if (board[i][j] === "M") {
                    div.innerText = MONTHS[month-1].toString();
                } else if (board[i][j] === "D") {
                    div.innerText = day.toString();
                }else if (board[i][j] === "W") {
                    div.innerText = WEEKDAYS[weekday].toString();
                }

                cell.appendChild(div);
            }
        }
    });
}


function initialize() {
    document.getElementById(PUZZLE_TYPE_FORM_ID).onchange=onChangePuzzleType;
    document.getElementById(SOLVE_BUTTON_ID).onclick=buttonOnClick;

    addOptions();
}

initialize();
