class World {
    constructor(numCreatures, numFood)
    {
        this.creatures = [];
        this.food = [];
        for(let i = 0; i < numCreatures; i++) this.creatures.push(new Creature());
        for(let i = 0; i < numFood; i++) this.food.push(new Food());
    }

    update()
    {
        for(let c of this.creatures) c.update(this.food, this.creatures);
        //removes dead from arr
        this.creatures = this.creatures.filter(c => !c.isDead()); 
    }

    show()
    {
        for(let f of this.food) f.show();
        for(let c of this.creatures) c.show();
    }
}