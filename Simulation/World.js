class World {
    constructor(numCreatures, numFood) {
        this.populationSize = numCreatures;
        this.foodCount = numFood;
        this.creatures = [];
        this.food = [];
        this.species = [];
        this.compatibilityCache = new Map();
        this.genomeIds = new WeakMap();
        this.nextGenomeId = 0;
        this.generation = 1;
        this.frames = 0;
        this.bestFitness = 0;
        this.generationGenomes = [];
        this.collected = new Set();
        for(let i = 0; i < numCreatures; i++) this.creatures.push(new Creature(new Genome()));
        for(let i = 0; i < numFood; i++) this.food.push(new Food());
    }

    update() {
        this.frames++;
        for(let c of this.creatures) if(c.alive) c.update(this.food, this.creatures);
        for(let c of this.creatures) if(!c.alive && !this.collected.has(c)) {
            c.genome.fitness = c.fitness;
            this.generationGenomes.push(c.genome);
            this.collected.add(c);
        }
        this.creatures = this.creatures.filter(c => !c.isDead());
        if(!this.creatures.length) this.nextGeneration();
    }

    nextGeneration() {
        let genomes = this.generationGenomes;
        if(!genomes.length) genomes = Array.from({ length: this.populationSize }, () => new Genome());
        genomes.sort((a, b) => b.fitness - a.fitness);
        this.bestFitness = max(this.bestFitness, genomes[0].fitness);
        this.speciate(genomes);
        let next = [];
        let champion = genomes[0];
        next.push(champion);
        let totalAdjustedFitness = 0;
        for(let species of this.species) {
            species.members.sort((a, b) => b.fitness - a.fitness);
            species.bestFitness = max(species.bestFitness, species.members[0].fitness);
            for(let genome of species.members) {
                genome.adjustedFitness = genome.fitness / species.members.length;
                totalAdjustedFitness += genome.adjustedFitness;
            }
        }
        for(let species of this.species) {
            let parentPool = species.members.slice(0, max(1, ceil(species.members.length * 0.5)));
            let speciesFitness = species.members.reduce((sum, genome) => sum + genome.adjustedFitness, 0);
            let offspring = totalAdjustedFitness > 0 ? floor((this.populationSize - 1) * speciesFitness / totalAdjustedFitness) : 0;
            while(offspring-- > 0 && next.length < this.populationSize) {
                let first = random(parentPool);
                let second = random(parentPool);
                let child = first.crossover(second);
                child.mutate();
                next.push(child);
            }
        }
        while(next.length < this.populationSize) {
            let parent = random(genomes.slice(0, max(1, ceil(genomes.length * 0.5))));
            let child = parent.crossover(parent);
            child.mutate();
            next.push(child);
        }
        this.generation++;
        this.frames = 0;
        this.creatures = next.map(g => new Creature(g));
        this.generationGenomes = [];
        this.collected = new Set();
    }

    speciate(genomes) {
        if(this.compatibilityCache.size > 5000) this.compatibilityCache.clear();
        for(let species of this.species) species.reset();
        for(let genome of genomes) {
            let species = this.species.find(s => this.compatibilityDistance(genome, s.representative) < 3);
            if(!species) {
                species = new Species(genome);
                this.species.push(species);
            }
            species.add(genome);
        }
        this.species = this.species.filter(s => s.members.length);
    }

    compatibilityDistance(first, second) {
        if(!this.genomeIds.has(first)) this.genomeIds.set(first, this.nextGenomeId++);
        if(!this.genomeIds.has(second)) this.genomeIds.set(second, this.nextGenomeId++);
        let a = this.genomeIds.get(first);
        let b = this.genomeIds.get(second);
        let key = a < b ? `${a}|${b}` : `${b}|${a}`;
        if(!this.compatibilityCache.has(key)) this.compatibilityCache.set(key, first.distance(second));
        return this.compatibilityCache.get(key);
    }

    show() {
        for(let f of this.food) f.show();
        for(let c of this.creatures) c.show();
        noStroke();
        fill('white');
        text(`Generation: ${this.generation}  Population: ${this.creatures.length}  Species: ${this.species.length}`, -width / 2 + 15, -height / 2 + 40);
    }
}
