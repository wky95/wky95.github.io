const board = document.getElementById("board");
const size = 19;

let matrix = Array.from({ length: size }, () => Array(size).fill(0));

function CheckWin() {
    let dx = [0, 1, 1, 1]
    let dy = [1, 0, 1, -1]
    function Avail(i, j) {
        return i >= 0 && i < size && j >= 0 && j < size
    }
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (matrix[i][j] == 0) continue;
            let color = matrix[i][j];
            for (let d = 0; d < 4; d++) {
                let ok = 1;
                for (let k = 0; k <= 4; k++) {
                    let ni = i + dx[d] * k;
                    let nj = j + dy[d] * k;
                    if (!Avail(ni, nj) || matrix[ni][nj] != color) ok = 0;
                }
                if (ok) return color;
            }
        }
    }
    return 0;
};
function Init() {
    let currentPlayer = 'black';
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            matrix[i][j] = 0;
            const cell = document.createElement("div");
            cell.className = "cell_black";
            
            cell.id = String(i * size + j);
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            cell.addEventListener("click", function () {
                if (cell.querySelector(".stone")) return; // 已有棋子不能再放

                const stone = document.createElement("img");
                stone.className = "stone ";
                stone.src = "Assets/" + currentPlayer + "stone.png"
                cell.appendChild(stone);

                matrix[i][j] = (currentPlayer == "black") ? 1 : 2;
                // 換邊
                currentPlayer = (currentPlayer === "black") ? "white" : "black";
                
                for (let ii = 0; ii < size * size; ii++) {
                    tmp_cell = document.getElementById(String(ii));
                    tmp_cell.className = "cell_" + currentPlayer;
                }

                let res = CheckWin();
                if (res != 0) {
                    alert((res == 1 ? "Black" : "White") + " wins");
                    document.getElementById("board").innerHTML = "" // Clear the Board
                    Init();
                }
            });

            const h_line = document.createElement("div");
            const v_line = document.createElement("div");
            h_line.className = "center-line-horizontal"
            v_line.classList = "center-line-vertical"
            if (i < size - 1) cell.appendChild(v_line);
            if (j < size - 1) cell.appendChild(h_line);
            board.appendChild(cell);
        }
    }
}
Init();