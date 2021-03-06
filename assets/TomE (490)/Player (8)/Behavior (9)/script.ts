class PlayerBehavior extends Sup.Behavior {
  baseSpeed = 20;//0.05;

  position = this.actor.getLocalPosition();
  moveOffset = new Sup.Math.Vector3(0,0,0);
  moveTargetX: number = null;
  scale = this.actor.getLocalScale();
  canMove = false;
  autoPilot = false;

  mousePosition = new Sup.Math.Vector3(0,0,0);
  hoveredItem: Sup.Actor;
  targetItem: Sup.Actor;
  activateDistance = 100;

  awake() {
    TomE.playerBehavior = this;
  }

  update() {    
    let mousePosition = Sup.Input.getMousePosition();
    let screenSize = Sup.Input.getScreenSize();

    mousePosition.x *= 10 / 2 * screenSize.x / screenSize.y;
    mousePosition.x += TomE.cameraBehavior.position.x;
    mousePosition.y *= 10 / 2;
    mousePosition.y += TomE.cameraBehavior.position.y;

    this.mousePosition.set(mousePosition.x, mousePosition.y, 0);

    if (!this.canMove) {
      return;
    }
    
    this.interaction();
  }
  
  clearMovement() {
    this.moveTargetX = null;
    this.moveOffset.x = 0;
    this.targetItem = null;
    this.autoPilot = false;
  }
    
  interaction() {
    
    if(TomE.menuOpen) {
      return;
    }
    
    // Update interactions
    let closestItem: Sup.Actor = null;
    let minDistance = 1000;
    
    TomE.itemBehaviors.forEach((itemBehavior) => {
      let diff = this.mousePosition.clone().subtract(itemBehavior.position);
      diff.x -= itemBehavior.hitbox.offsetX;
      diff.y -= itemBehavior.hitbox.offsetY;
      let distance = diff.length();
      
      if (Math.abs(diff.x) < itemBehavior.hitbox.width && Math.abs(diff.y) < itemBehavior.hitbox.height) {
        minDistance = distance;
        closestItem = itemBehavior.actor;
      }
    });
    
    if (closestItem == null && this.hoveredItem != null) {
      this.hoveredItem.getBehavior(ItemBehavior).hover(false);
      this.hoveredItem = null;
    }
    
    if (closestItem != null && closestItem != this.hoveredItem) {
      if (this.hoveredItem != null) {
        this.hoveredItem.getBehavior(ItemBehavior).hover(false)
      }
        
      this.hoveredItem = closestItem;
      this.hoveredItem.getBehavior(ItemBehavior).hover(true);
      new Sup.Audio.SoundPlayer(TomE.hoverSound).play();
    }
    
    if (TomE.dialogBehavior.closedTimer > 2 && TomE.fsdialogBehavior.closedTimer > 2 && !Cutscene.active) {
      
      if (Sup.Input.wasMouseButtonJustReleased(0) || Sup.Input.wasKeyJustPressed("SPACE")) {
        this.targetItem = this.hoveredItem;
        if (this.targetItem != null) {
          this.activateItem(this.targetItem);
          new Sup.Audio.SoundPlayer(TomE.selectSound).play();
        }
      }
      
    }
    
    //debug new/save/load
    if(Sup.Input.isKeyDown("SHIFT")) {
      //loading 
      if(Sup.Input.wasKeyJustPressed("1")) {
        TomE.loadGame("1");
      } else if(Sup.Input.wasKeyJustPressed("2")) {
        TomE.loadGame("2");
      } else if(Sup.Input.wasKeyJustPressed("3")) {
        TomE.loadGame("3");
      } else if(Sup.Input.wasKeyJustPressed("0")) {
        TomE.loadGame("auto");
      } else if(Sup.Input.wasKeyJustPressed("N")) {
        TomE.loadGame("new");
      }
    } else {
      //saving
      if(Sup.Input.wasKeyJustPressed("1")) {
        TomE.saveGame("1");
      } else if(Sup.Input.wasKeyJustPressed("2")) {
        TomE.saveGame("2");
      } else if(Sup.Input.wasKeyJustPressed("3")) {
        TomE.saveGame("3");
      } 
      //menus
      else if(GameConfig.stateDebugKey != null &&  Sup.Input.wasKeyJustPressed(GameConfig.stateDebugKey)) {
        TomE.openMenu("StateDebugMenu");
      } else if(GameConfig.sceneDebugKey != null &&  Sup.Input.wasKeyJustPressed(GameConfig.sceneDebugKey)) {
        TomE.openMenu("SceneLoadMenu");
      } else if(GameConfig.skinDebugKey != null &&  Sup.Input.wasKeyJustPressed(GameConfig.skinDebugKey)) {
        TomE.openMenu("SkinsDebugMenu");
      } else if(GameConfig.invDebugKey != null &&  Sup.Input.wasKeyJustPressed(GameConfig.invDebugKey)) {
        TomE.openMenu("InventoryDebugMenu");
      } 
    }
  }
  
  activateItem(item: Sup.Actor) {
    if (item["actionBehavior"] == null) {
      Sup.log("ActionBehavior isn't defined");
    } else {
      if (item.getBehavior(ItemBehavior).position.x > this.position.x) {
        this.scale.x = 1;
      } else {
        this.scale.x = -1;
      }
      this.actor.setLocalScale(this.scale);

      this.clearMovement();
      item["actionBehavior"].activate();
    }
  }

}
Sup.registerBehavior(PlayerBehavior);
