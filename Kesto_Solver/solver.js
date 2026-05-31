// JS implementation of the A* Bitboard Kesto Solver

const ROW0_MASK = 0x00000000000000FFn;
const ROW7_MASK = 0xFF00000000000000n;
const COL0_MASK = 0x0101010101010101n;
const COL7_MASK = 0x8080808080808080n;

const NOT_COL7_MASK = 0x7F7F7F7F7F7F7F7Fn;
const NOT_COL0_MASK = 0xFEFEFEFEFEFEFEFEn;
const MASK_64 = 0xFFFFFFFFFFFFFFFFn;

const INF = 10000;

function shiftU(x) { return x >> 8n; }
function shiftD(x) { return (x << 8n) & MASK_64; }
function shiftL(x) { return (x >> 1n) & NOT_COL7_MASK; }
function shiftR(x) { return (x << 1n) & NOT_COL0_MASK & MASK_64; }

function ctzll(n) {
    if (n === 0n) return 64;
    let count = 0;
    while ((n & 1n) === 0n) {
        count++;
        n >>= 1n;
    }
    return count;
}

class PriorityQueue {
    constructor() {
        this.heap = [];
    }
    push(node) {
        this.heap.push(node);
        this.bubbleUp(this.heap.length - 1);
    }
    pop() {
        const top = this.heap[0];
        const bottom = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = bottom;
            this.sinkDown(0);
        }
        return top;
    }
    isEmpty() {
        return this.heap.length === 0;
    }
    bubbleUp(idx) {
        const node = this.heap[idx];
        while (idx > 0) {
            const parentIdx = Math.floor((idx - 1) / 2);
            const parent = this.heap[parentIdx];
            // Sort by f ascending, then g descending
            if (node.f > parent.f || (node.f === parent.f && node.g <= parent.g)) break;
            this.heap[idx] = parent;
            idx = parentIdx;
        }
        this.heap[idx] = node;
    }
    sinkDown(idx) {
        const length = this.heap.length;
        const node = this.heap[idx];
        while (true) {
            const leftChildIdx = 2 * idx + 1;
            const rightChildIdx = 2 * idx + 2;
            let leftChild, rightChild;
            let swapIdx = null;

            if (leftChildIdx < length) {
                leftChild = this.heap[leftChildIdx];
                if (leftChild.f < node.f || (leftChild.f === node.f && leftChild.g > node.g)) {
                    swapIdx = leftChildIdx;
                }
            }
            if (rightChildIdx < length) {
                rightChild = this.heap[rightChildIdx];
                const compareNode = swapIdx === null ? node : leftChild;
                if (rightChild.f < compareNode.f || (rightChild.f === compareNode.f && rightChild.g > compareNode.g)) {
                    swapIdx = rightChildIdx;
                }
            }
            if (swapIdx === null) break;
            this.heap[idx] = this.heap[swapIdx];
            idx = swapIdx;
        }
        this.heap[idx] = node;
    }
}

class Solver {
    constructor(bgGrid, fgGrid) {
        this.bgGrid = bgGrid;
        this.fgGrid = fgGrid;
        this.WALLS = this.encodeBg('#');
        this.TARGET = this.encodeBg('T');
        this.start_state = this.encodeFg('Y');
        this.dist_table = new Array(64).fill(INF);
        this.initHeuristicTable();
    }

    encodeBg(targetChar) {
        let bitboard = 0n;
        for (let r = 0; r < 8; ++r) {
            for (let c = 0; c < 8; ++c) {
                if (this.bgGrid[r][c] === targetChar) {
                    bitboard |= (1n << BigInt(r * 8 + c));
                }
            }
        }
        return bitboard;
    }

    encodeFg(targetChar) {
        let bitboard = 0n;
        for (let r = 0; r < 8; ++r) {
            for (let c = 0; c < 8; ++c) {
                if (this.fgGrid[r][c] === targetChar) {
                    bitboard |= (1n << BigInt(r * 8 + c));
                }
            }
        }
        return bitboard;
    }

    initHeuristicTable() {
        const q = [];
        for (let i = 0; i < 64; ++i) {
            if ((this.TARGET >> BigInt(i)) & 1n) {
                this.dist_table[i] = 0;
                q.push(i);
            }
        }

        while (q.length > 0) {
            const curr = q.shift();
            const r = Math.floor(curr / 8);
            const c = curr % 8;

            // U
            if (r > 0 && !((this.WALLS >> BigInt(curr - 8)) & 1n) && this.dist_table[curr - 8] > this.dist_table[curr] + 1) {
                this.dist_table[curr - 8] = this.dist_table[curr] + 1; q.push(curr - 8);
            }
            // D
            if (r < 7 && !((this.WALLS >> BigInt(curr + 8)) & 1n) && this.dist_table[curr + 8] > this.dist_table[curr] + 1) {
                this.dist_table[curr + 8] = this.dist_table[curr] + 1; q.push(curr + 8);
            }
            // L
            if (c > 0 && !((this.WALLS >> BigInt(curr - 1)) & 1n) && this.dist_table[curr - 1] > this.dist_table[curr] + 1) {
                this.dist_table[curr - 1] = this.dist_table[curr] + 1; q.push(curr - 1);
            }
            // R
            if (c < 7 && !((this.WALLS >> BigInt(curr + 1)) & 1n) && this.dist_table[curr + 1] > this.dist_table[curr] + 1) {
                this.dist_table[curr + 1] = this.dist_table[curr] + 1; q.push(curr + 1);
            }
        }
    }

    getHeuristic(state) {
        let h = 0;
        let temp = state;
        while (temp > 0n) {
            let idx = ctzll(temp);
            if (this.dist_table[idx] === INF) return INF;
            if (this.dist_table[idx] > h) h = this.dist_table[idx];
            temp &= (temp - 1n);
        }
        return h;
    }

    shiftU(x) { return x >> 8n; }
    shiftD(x) { return (x << 8n) & MASK_64; }
    shiftL(x) { return (x >> 1n) & NOT_COL7_MASK; }
    shiftR(x) { return (x << 1n) & NOT_COL0_MASK; }

    moveBitboard(state, dir) {
        let moving = state; 
        
        for (let i = 0; i < 8; ++i) {
            let edge_blocked_src = 0n;
            if (dir === 0) edge_blocked_src = moving & ROW0_MASK;
            else if (dir === 1) edge_blocked_src = moving & ROW7_MASK;
            else if (dir === 2) edge_blocked_src = moving & COL0_MASK;
            else if (dir === 3) edge_blocked_src = moving & COL7_MASK;

            let dest = 0n;
            if (dir === 0) dest = this.shiftU(moving);
            else if (dir === 1) dest = this.shiftD(moving);
            else if (dir === 2) dest = this.shiftL(moving);
            else if (dir === 3) dest = this.shiftR(moving);

            let stationary = state ^ moving;
            let blocked_dest = dest & (this.WALLS | stationary);
            
            let blocked_src = edge_blocked_src;
            if (dir === 0) blocked_src |= this.shiftD(blocked_dest) & moving;
            else if (dir === 1) blocked_src |= this.shiftU(blocked_dest) & moving;
            else if (dir === 2) blocked_src |= this.shiftR(blocked_dest) & moving;
            else if (dir === 3) blocked_src |= this.shiftL(blocked_dest) & moving;

            if (blocked_src === 0n) break;
            moving ^= blocked_src;
        }

        let final_dest = 0n;
        if (dir === 0) final_dest = this.shiftU(moving);
        else if (dir === 1) final_dest = this.shiftD(moving);
        else if (dir === 2) final_dest = this.shiftL(moving);
        else if (dir === 3) final_dest = this.shiftR(moving);

        return (state ^ moving) | final_dest;
    }

    solve(maxNodes = 500000) { // Safety limit for browser
        const open_list = new PriorityQueue();
        const best_g = new Map();
        const dirChars = ['U', 'D', 'L', 'R'];
        const dirIndices = [0, 1, 2, 3]; // Used for path states
        
        let start_h = this.getHeuristic(this.start_state);
        if (start_h === INF) {
            return { success: false, message: "Unsolvable: Block is trapped.", path: [], states: [] };
        }
        
        // We will store states in path so we can animate them
        open_list.push({ state: this.start_state, g: 0, h: start_h, f: start_h, path: [], states: [this.start_state] });
        best_g.set(this.start_state, 0);

        let nodes_explored = 0;

        while (!open_list.isEmpty()) {
            const curr = open_list.pop();
            nodes_explored++;

            if (nodes_explored > maxNodes) {
                return { success: false, message: `Explored ${maxNodes} nodes without finding a solution.`, path: [], states: [] };
            }

            // Check if all blocks are on targets
            // (Wait, C++ solver checks if state == TARGET.
            //  Actually, what if there are more targets than blocks?
            //  The C++ solver uses `if (curr.state == TARGET)`.
            //  So it assumes the number of blocks equals the number of targets and they perfectly match.)
            if (curr.state === this.TARGET) {
                return { 
                    success: true, 
                    message: `Optimal solution in ${curr.g} steps`,
                    path: curr.path,
                    states: curr.states
                };
            }

            for (let i = 0; i < 4; ++i) {
                const next_state = this.moveBitboard(curr.state, i);
                if (next_state === curr.state) continue;

                const next_g = curr.g + 1;
                if (best_g.has(next_state) && best_g.get(next_state) <= next_g) continue;

                const h = this.getHeuristic(next_state);
                if (h === INF) continue;

                best_g.set(next_state, next_g);
                open_list.push({
                    state: next_state,
                    g: next_g,
                    h: h,
                    f: next_g + h,
                    path: [...curr.path, dirChars[i]],
                    states: [...curr.states, next_state]
                });
            }
        }

        return { success: false, message: "No solution exists for this board.", path: [], states: [] };
    }
}
