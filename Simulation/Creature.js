class Creature {
    constructor(genome = new Genome()) {
        this.x = random(-width / 2, width / 2);
        this.y = random(-height / 2, height / 2);
        this.energy = 100;
        this.weight = this.energy / 15;
        this.v = p5.Vector.random2D();
        this.alive = true;
        this.senseRadius = 100;
        this.genome = genome;
        this.genome.fitness = 0;
        this.fitness = 0;
        this.age = 0;
        this.pred = random() < 0.05;
        this.speed = this.pred ? 1.55 : 1;
        if(this.pred) {
            this.energy += 15;
            this.weight += 8;
        }
    }

    move() {
        this.x += this.v.x * this.speed;
        this.y += this.v.y * this.speed;
        this.energy -= 0.25;
        if(this.x > width / 2) this.x = -width / 2;
        else if(this.x < -width / 2) this.x = width / 2;
        if(this.y > height / 2) this.y = -height / 2;
        else if(this.y < -height / 2) this.y = height / 2;
    }

    sense(foodArray, creatureArray) {
        let inputs = Array(8).fill(0);
        let objects = [...foodArray, ...creatureArray.filter(c => c !== this && c.alive)];
        let radius = this.senseRadius;
        for(let object of objects) {
            let dx = object.x - this.x;
            let dy = object.y - this.y;
            let distance = sqrt(dx * dx + dy * dy);
            if(distance <= 0 || distance >= radius) continue;
            let angle = (atan2(dy, dx) + TWO_PI) % TWO_PI;
            let direction = round(angle / (TWO_PI / inputs.length)) % inputs.length;
            inputs[direction] += 1 - distance / radius;
        }
        return inputs.map(value => constrain(value, 0, 1));
    }

    think(foodArray, creatureArray) {
        let output = this.genome.feedForward(this.sense(foodArray, creatureArray));
        let desired = createVector(output[0], output[1]);
        if(desired.magSq() > 0.001) {
            desired.normalize();
            this.v.lerp(desired, 0.12);
            this.v.normalize();
        }
    }

    eat(foodArray, creatureArray) {
        if(!this.pred) {
            for(let i = foodArray.length - 1; i >= 0; i--) {
                let f = foodArray[i];
                if(dist(this.x, this.y, f.x, f.y) < this.weight) {
                    this.energy += f.energy;
                    this.fitness += f.energy;
                    this.weight += f.energy / 25;
                    this.senseRadius += f.energy / 50;
                    f.respawn();
                }
            }
        } else {
            for(let c of creatureArray) {
                if(c !== this && c.alive && !c.pred && this.weight > c.weight && dist(this.x, this.y, c.x, c.y) < this.weight) {
                    this.energy += c.weight * 5;
                    this.fitness += c.weight * 5;
                    this.weight += c.weight / 4;
                    this.senseRadius += c.weight / 2;
                    c.alive = false;
                }
            }
        }
    }

    update(foodArray, creatureArray) {
        this.age++;
        this.move();
        this.think(foodArray, creatureArray);
        this.eat(foodArray, creatureArray);
        this.fitness += 0.01;
        if(this.energy <= 0 || this.age >= 6000) this.alive = false;
    }

    isDead() {
        return !this.alive;
    }

    show() {
        noStroke();
        fill(this.pred ? 'red' : 'green');
        if(this.energy <= 10) fill('white');
        circle(this.x, this.y, this.weight * 2);
    }
}
