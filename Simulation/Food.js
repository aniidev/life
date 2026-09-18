class Food {
    constructor() {
        this.respawn();
    }
  
    respawn()
    {
        this.x = random(-width/2, width/2);
        this.y = random(-height/2, height/2);
        this.energy = random(10, 30);
    }
    show() {
        fill('white');
        circle(this.x, this.y, this.energy/10);
    }
  }