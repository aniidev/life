class Creature {
    constructor() {
      this.x = random(-width/2, width/2);
      this.y = random(-height/2, height/2);
      this.energy = 100;
      this.weight = this.energy / 15;
      this.v = p5.Vector.random2D();
      this.alive = true;
      this.senseRadius = 100;
      this.smart = random(0,100) >= 5 ? true : false; //temp
      this.pred = false;
      if(!this.smart) this.pred = true; 

      this.speed = 1;
      if(this.pred)
      {
        this.energy += 15;
        this.weight += 5;
        this.speed = 1.5;
      }
    }
    
  
    move() {
      this.x += this.v.x * this.speed + random(-2, 2);
      this.y += this.v.y * this.speed + random(-2, 2);
      this.energy-=0.25;
      if(this.x > width/2) this.x = -width/2;
      else if(this.x < -width/2) this.x = width/2;

      if(this.y > height/2) this.y = -height/2;
      else if(this.y < -height/2) this.y = height/2;
    }
    sense(foodArray)
    {
        let closest = null;
        let closestD = this.senseRadius;
        for(let f of foodArray)
        {
            
            let d = dist(this.x, this.y, f.x, f.y);
            if(d < closestD)
            {
                closestD = d;
                closest = f;
            }
        }
        if(closest)
        {
            let desired = createVector(closest.x - this.x, closest.y - this.y);
            desired.normalize();
            this.v.lerp(desired, 0.1);
            this.v.normalize();
        }
    }
    chase(creatureArray)
    {
        let closest = null;
        let closestD = this.senseRadius;
        for(let c of creatureArray)
        {
            if(c.weight < this.weight && !c.pred)
            {
                let d = dist(this.x, this.y, c.x, c.y);
                if( d < closestD)
                {
                    closestD = d;
                    closest = c;
                }
            }
        }
        if(closest)
        {
            let desired = createVector(closest.x - this.x, closest.y - this.y);
            desired.normalize();
            this.v.lerp(desired, 0.1);
            this.v.normalize();
            return true; //found prey, chasing
        }
        return false;
    }
    run(creatureArray)
    {
        let closest = null;
        let closestD = Infinity; 
        for(let c of creatureArray)
        {
            if(c.weight > this.weight)
            {
                let effectiveRange = this.senseRadius * (c.weight / this.weight);
                let d = dist(this.x, this.y, c.x, c.y);
                if(d < closestD && d < effectiveRange)
                {
                    closestD = d;
                    closest = c;
                }
            }
        }
        if(closest)
        {
            //go opposite way
            let desired = createVector(this.x - closest.x, this.y - closest.y);
            desired.normalize();
            this.v.lerp(desired, 0.1);
            this.v.normalize();
            return true; //threat found
        }
        return false;
    }
    eat(foodArray, creatureArray)
    {
        //food
        if(!this.pred)
        {
        for(let i = foodArray.length - 1; i >= 0; i--) //backwards cuz splicing arr
        {
            let f = foodArray[i];
            let d = dist(this.x, this.y, f.x, f.y);
            if(d < this.weight)
            {
                this.energy += f.energy;
                this.weight += f.energy/25;
                this.senseRadius += f.energy/50;
                if(random(0,1) >= 0) f.respawn();
                else foodArray.splice(i, 1);
            }
        }
        }

        if(this.pred)
        {
        for(let i = creatureArray.length - 1; i >= 0; i--)
        {
            let c = creatureArray[i];
            let d = dist(this.x, this.y, c.x, c.y);
            if(d < this.weight && this.weight > c.weight && !c.pred)
            {
                this.energy += c.weight * 5;
                creatureArray.splice(i, 1);
                this.weight += c.weight/4;
                this.senseRadius += c.weight/2;
                c.alive = true;
            }
        }    
    }   
    }
    //sense + move + eat + energy
    update(foodArray, creatureArray)
    {
        this.move();
        this.eat(foodArray, creatureArray);
        if(this.smart) 
        {
            if(!this.run(creatureArray)) this.sense(foodArray);
        }
        if(this.pred) 
        {
            this.chase(creatureArray);
            
        }


        if(this.energy <= 0) this.alive = false;
        else if(this.energy >= 400 )
        {
            this.energy = 150;
            this.weight /= 2;
            let child = this.clone();
            creatureArray.push(child);
        }
    }

    isDead()
    {
        return !this.alive;
    }

    show() {
        noStroke();
        fill('white');
        if(this.smart) fill('green')
        if(this.pred) fill('red');
        
        circle(this.x, this.y, this.weight * 2);
    }

    clone() {
        let child = new Creature();
        child.x = this.x + random(-10, 10);
        child.y = this.y + random(-10, 10);
        child.energy = 100;
        child.weight = this.weight * random(0.9, 1.1);
        child.senseRadius = this.senseRadius * random(0.9, 1.1);
        child.speed = this.speed * random(0.9, 1.1);
        child.smart = this.smart;
        child.pred = this.pred;
        return child;
    }    
}