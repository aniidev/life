let innovationNumber = 0;
let innovationHistory = [];
let nextNodeNumber = 0;

class NodeGene {
    constructor(number, type) {
        this.number = number;
        this.type = type;
        this.value = 0;
    }
}

class ConnectionGene {
    constructor(from, to, weight, enabled, innovation) {
        this.from = from;
        this.to = to;
        this.weight = weight;
        this.enabled = enabled;
        this.innovation = innovation;
    }
}

class Genome {
    constructor(inputs = 8, outputs = 2, initialize = true) {
        this.inputCount = inputs;
        this.outputCount = outputs;
        this.nodes = [];
        this.connections = [];
        this.fitness = 0;
        this.adjustedFitness = 0;
        this.species = null;
        for(let i = 0; i < inputs; i++) this.nodes.push(new NodeGene(i, 'input'));
        for(let i = 0; i < outputs; i++) this.nodes.push(new NodeGene(inputs + i, 'output'));
        nextNodeNumber = max(nextNodeNumber, inputs + outputs);
        if(initialize) {
            for(let i = 0; i < inputs; i++) {
                for(let j = 0; j < outputs; j++) this.addConnection(i, inputs + j, random(-1, 1));
            }
        }
    }

    addConnection(from, to, weight) {
        if(from === to || this.nodes.find(n => n.number === to)?.type === 'input') return false;
        if(this.connections.some(c => c.from === from && c.to === to)) return false;
        if(this.pathExists(to, from)) return false;
        let innovation = innovationHistory.find(i => i.from === from && i.to === to);
        if(!innovation) {
            innovation = { from, to, number: innovationNumber++ };
            innovationHistory.push(innovation);
        }
        this.connections.push(new ConnectionGene(from, to, weight, true, innovation.number));
        return true;
    }

    pathExists(start, target, visited = new Set()) {
        if(start === target) return true;
        if(visited.has(start)) return false;
        visited.add(start);
        for(let c of this.connections) {
            if(c.enabled && c.from === start && this.pathExists(c.to, target, visited)) return true;
        }
        return false;
    }

    mutate() {
        for(let c of this.connections) {
            if(random() < 0.8) {
                if(random() < 0.9) c.weight = constrain(c.weight + randomGaussian() * 0.35, -5, 5);
                else c.weight = random(-2, 2);
            }
        }
        if(random() < 0.08) this.mutateConnection();
        if(random() < 0.03) this.mutateNode();
        if(random() < 0.01) {
            let disabled = this.connections.filter(c => !c.enabled);
            if(disabled.length) random(disabled).enabled = true;
        }
    }

    mutateConnection() {
        let candidates = [];
        for(let from of this.nodes) {
            for(let to of this.nodes) {
                if(from.type !== 'output' && to.type !== 'input' && from.number !== to.number &&
                    !this.connections.some(c => c.from === from.number && c.to === to.number) && !this.pathExists(to.number, from.number)) {
                    candidates.push([from.number, to.number]);
                }
            }
        }
        if(candidates.length) {
            let connection = random(candidates);
            this.addConnection(connection[0], connection[1], random(-1, 1));
        }
    }

    mutateNode() {
        let enabled = this.connections.filter(c => c.enabled);
        if(!enabled.length) return;
        let connection = random(enabled);
        connection.enabled = false;
        let history = innovationHistory.find(i => i.number === connection.innovation);
        let split = history.splitNode;
        if(split === undefined) {
            split = nextNodeNumber++;
            history.splitNode = split;
        }
        if(!this.nodes.some(n => n.number === split)) this.nodes.push(new NodeGene(split, 'hidden'));
        this.addConnection(connection.from, split, 1);
        this.addConnection(split, connection.to, connection.weight);
    }

    feedForward(inputs) {
        for(let node of this.nodes) node.value = 0;
        for(let i = 0; i < this.inputCount; i++) this.nodes[i].value = inputs[i] || 0;
        let evaluated = new Set(this.nodes.filter(n => n.type === 'input').map(n => n.number));
        let remaining = this.nodes.filter(n => n.type !== 'input');
        while(remaining.length) {
            let index = remaining.findIndex(node => this.connections.filter(c => c.enabled && c.to === node.number).every(c => evaluated.has(c.from)));
            if(index < 0) break;
            let node = remaining.splice(index, 1)[0];
            let sum = 0;
            for(let c of this.connections) {
                if(c.enabled && c.to === node.number) sum += this.nodes.find(n => n.number === c.from).value * c.weight;
            }
            node.value = Math.tanh(sum);
            evaluated.add(node.number);
        }
        return this.nodes.filter(n => n.type === 'output').map(n => n.value);
    }

    crossover(other) {
        let fitter = this.fitness >= other.fitness ? this : other;
        let weaker = fitter === this ? other : this;
        let child = new Genome(this.inputCount, this.outputCount, false);
        child.nodes = fitter.nodes.map(n => new NodeGene(n.number, n.type));
        let weakConnections = new Map(weaker.connections.map(c => [c.innovation, c]));
        for(let gene of fitter.connections) {
            let matching = weakConnections.get(gene.innovation);
            let chosen = matching ? random() < 0.5 ? gene : matching : gene;
            let copy = new ConnectionGene(chosen.from, chosen.to, chosen.weight, chosen.enabled, chosen.innovation);
            if(matching && (!gene.enabled || !matching.enabled) && random() < 0.75) copy.enabled = false;
            child.connections.push(copy);
        }
        return child;
    }

    distance(other) {
        let a = [...this.connections].sort((x, y) => x.innovation - y.innovation);
        let b = [...other.connections].sort((x, y) => x.innovation - y.innovation);
        let i = 0, j = 0, excess = 0, disjoint = 0, matching = 0, weightDifference = 0;
        let maxA = a.length ? a[a.length - 1].innovation : -1;
        let maxB = b.length ? b[b.length - 1].innovation : -1;
        while(i < a.length && j < b.length) {
            if(a[i].innovation === b[j].innovation) {
                matching++;
                weightDifference += abs(a[i].weight - b[j].weight);
                i++; j++;
            } else if(a[i].innovation < b[j].innovation) {
                if(a[i].innovation > maxB) excess++; else disjoint++;
                i++;
            } else {
                if(b[j].innovation > maxA) excess++; else disjoint++;
                j++;
            }
        }
        excess += a.length - i + b.length - j;
        let normalizer = max(a.length, b.length) < 20 ? 1 : max(a.length, b.length);
        return excess / normalizer + disjoint / normalizer + (matching ? 0.4 * weightDifference / matching : 0);
    }
}

class Species {
    constructor(genome) {
        this.representative = genome;
        this.members = [];
        this.bestFitness = -Infinity;
        this.staleness = 0;
    }

    add(genome) {
        genome.species = this;
        this.members.push(genome);
    }

    reset() {
        this.representative = random(this.members);
        this.members = [];
    }
}
