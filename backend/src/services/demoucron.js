const INF = Infinity;

/**
 * Algorithme de Demoucron — chemin de valeur minimale
 * @param {number} n - nombre de sommets
 * @param {Array} arcs - [{ from, to, value }] (sommets indexés à partir de 1)
 * @returns {{ matrices, steps, predecessors }}
 */
function demoucron(n, arcs) {
  // ── Initialisation de D1 ─────────────────────────────────────────────
  const D1 = Array.from({ length: n }, () => Array(n).fill(INF));

  for (const arc of arcs) {
    const i = arc.from - 1;
    const j = arc.to - 1;
    D1[i][j] = arc.value;
  }

  const matrices = [{ k: 1, matrix: copyMatrix(D1), stepDetails: [] }];
  let prev = D1;

  // ── Itérations k = 2 … n-1 ──────────────────────────────────────────
  for (let k = 2; k <= n - 1; k++) {
    const Dk = copyMatrix(prev);
    const stepDetails = [];

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        // Pivot = sommet k (index k-1)
        const vik = prev[i][k - 1];
        const vkj = prev[k - 1][j];

        if (vik === INF || vkj === INF) continue;

        const wij = vik + vkj;
        const oldVal = prev[i][j];

        if (wij < oldVal) {
          Dk[i][j] = wij;
          stepDetails.push({
            i: i + 1,
            j: j + 1,
            pivot: k,
            vik,
            vkj,
            wij,
            oldVal: oldVal === INF ? '+∞' : oldVal,
            newVal: wij,
            changed: true,
          });
        } else {
          // Montrer le calcul même si pas de changement (pédagogique)
          if (vik < INF && vkj < INF) {
            stepDetails.push({
              i: i + 1,
              j: j + 1,
              pivot: k,
              vik,
              vkj,
              wij,
              oldVal: oldVal === INF ? '+∞' : oldVal,
              newVal: oldVal === INF ? '+∞' : oldVal,
              changed: false,
            });
          }
        }
      }
    }

    matrices.push({ k, matrix: copyMatrix(Dk), stepDetails });
    prev = Dk;
  }

  // ── Reconstruction des prédécesseurs depuis D(n-1) ───────────────────
  const finalMatrix = prev;
  const predecessors = buildPredecessors(n, finalMatrix, arcs);

  return {
    matrices,         // toutes les matrices D1…D(n-1)
    finalMatrix,      // la dernière matrice
    predecessors,     // tableau des prédécesseurs pour reconstruire les chemins
  };
}

/**
 * Pour chaque paire (i,j), trouver le prédécesseur de j sur le chemin minimal i→j
 * en cherchant la ligne du minimum dans la colonne j
 */
function buildPredecessors(n, finalMatrix, arcs) {
  // pred[i][j] = prédécesseur de j sur le chemin de i vers j
  const pred = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return null;
      if (finalMatrix[i][j] === INF) return null;
      // Chercher k tel que finalMatrix[i][k] + arc(k,j) = finalMatrix[i][j]
      for (let k = 0; k < n; k++) {
        if (k === j) continue;
        const arc = finalMatrix[i][k];
        const toJ = finalMatrix[k][j];
        if (arc !== INF && toJ !== INF && arc + toJ === finalMatrix[i][j]) {
          return k + 1;
        }
      }
      // Arc direct
      return i + 1;
    })
  );
  return pred;
}

/**
 * Reconstruire le chemin de i vers j
 */
function getPath(predecessors, from, to) {
  const path = [to];
  let current = to;
  let iterations = 0;
  while (current !== from && iterations < predecessors.length) {
    const p = predecessors[from - 1][current - 1];
    if (!p || p === current) break;
    path.unshift(p);
    current = p;
    iterations++;
  }
  return path;
}

function copyMatrix(m) {
  return m.map(row => [...row]);
}

module.exports = { demoucron, getPath };