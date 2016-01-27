module Cutscene {
        export var lineIdx = 0;
        export var sceneLines = [];
        export var sceneName = "";
        export var active = false;
        export var waitingForDialog = false;
        export var waitingForSound = false;
        
        export var leftActor: Sup.Actor;
        export var leftImage: string;
        
        export var rightActor: Sup.Actor;
        export var rightImage: string;
        
        var fdBehavior: Sup.Behavior;
        var branchA = "";
        var branchB = "";
        
        var playingSound: Sup.Audio.SoundPlayer;
        
        /**
         * Load a script into the manager and run it. 
         * If the script name is invalid an error message will be displayed instead.
         * 
         * @method update
         * @param scene {string} 'name' value of the script to load
         * @param finishDialogBehavior {Sup.Behavior} If a behavior is passed into the function,
         * on completeion of the script 'finishDialog' will be called on the behavior with
         * the name of the script passed in as the textId
         * @public
         */
        export function loadScript(scene: string, finishDialogBehavior?) {
          reset();
          
          scene = CutsceneList.getScene(scene);
          sceneName = scene["name"];
          sceneLines = scene["lines"];
          active = true;
          
          fdBehavior = finishDialogBehavior;
          
          if(Game.fsdialogBehavior != null)
          {
            Game.fsdialogBehavior.actor.setVisible(true);
            Game.fsdialogBehavior.blackoutActor.spriteRenderer.setOpacity(0.8);
          }
        }
        
        /**
         * Initialize all values of the cutscene manager
         * 
         * @method update
         * @public
         */
        export function reset()
        {
          lineIdx = 0;
          sceneLines = [];
          sceneName = "";
          waitingForDialog = false;
          active = false;
          
          leftImage = "Blank";
          rightImage = "Blank";
          
          leftActor = Sup.getActor("LCSActor");
          leftActor.spriteRenderer.setSprite(leftImage)
          leftActor.setVisible(false);
          
          rightActor = Sup.getActor("RCSActor");
          rightActor.spriteRenderer.setSprite(rightImage);
          rightActor.setVisible(false);
          
          if(Game.fsdialogBehavior != null)
          {
            Game.fsdialogBehavior.actor.setVisible(true);
            Game.fsdialogBehavior.blackoutActor.spriteRenderer.setOpacity(0);
          }
          
          this["finishDialog"] = null;
          branchA = "";
          branchB = "";
        }
        
        /**
         * If a cutscene is active, run the script parser until hitting an END call or a blocking call
         * 
         * @method update
         * @public
         */
        export function update() {
          
          if(active && !waitingForDialog && !waitingForSound) {
            var line = sceneLines[lineIdx];
          
            while(line != null && active && !waitingForDialog && !waitingForSound) {
              parseLine(line);

              lineIdx++;
              line = sceneLines[lineIdx];
            }  
          } else if (active && waitingForDialog) {
            if (!Game.dialogBehavior.isVisible && !Game.fsdialogBehavior.isVisible) {
              waitingForDialog = false;
              this["finishDialog"] = null;
              var line = sceneLines[lineIdx];

              while(line != null && active && !waitingForDialog && !waitingForSound) {
                parseLine(line);

                lineIdx++;
                line = sceneLines[lineIdx];
              }
            }
          } else if (active && waitingForSound) {
            if (playingSound == null || !playingSound.isPlaying()) {
              waitingForSound = false;
              playingSound = null;
              var line = sceneLines[lineIdx];

              while(line != null && active && !waitingForDialog && !waitingForSound) {
                parseLine(line);

                lineIdx++;
                line = sceneLines[lineIdx];
              }
            }
          }
          
        }
        
        /**
         * Takes a script line and parses it into a command
         * 
         * @method parseLine
         * @param line {string} The line to parse
         * @private
         */
        function parseLine(line: string) {
          Sup.log("Cutscene: " + line)
          if(line == "END") {
            var fdb = fdBehavior;
            var nombre = sceneName;
            
            exit("BOTH");
            reset();
            
            if(fdb != null) fdb["finishDialog"](nombre,"");
          }
          var spaceIdx = line.indexOf(' ');
          if (spaceIdx != -1) {
            var command = line.substr(0,spaceIdx);
            line = line.substr(spaceIdx+1,line.length);
            
            if (command == "ENTER") {
              
              spaceIdx = line.indexOf(' ');
              var side = line.substr(0,spaceIdx);
              line = line.substr(spaceIdx+1,line.length);
              
              enter(side, line);
              
            } else if (command == "SPEAK") {
              
              spaceIdx = line.indexOf(' ');
              var face = line.substr(0,spaceIdx);
              line = line.substr(spaceIdx+1,line.length);
              
              speak(face, line);
              
            }  else if (command == "BRANCH") {
              
              spaceIdx = line.indexOf(' ');
              var face = line.substr(0,spaceIdx);
              line = line.substr(spaceIdx+1,line.length);
              
              branch(face, line);
              
            }  else if (command == "LOADIFITEM") {
              
              spaceIdx = line.indexOf(' ');
              var item = line.substr(0,spaceIdx);
              line = line.substr(spaceIdx+1,line.length);
              
              loadifitem(item, line);
              
            } else if (command == "ANIMATE") {
              
              spaceIdx = line.indexOf(' ');
              var side = line.substr(0,spaceIdx);
              line = line.substr(spaceIdx+1,line.length);
              
              animate(side, line);
              
            } else if (command == "EXIT") {
              exit(line);
              
            } else if (command == "LOAD") {
              load(line);
              
            } else if (command == "SCENE") {
              scene(line, "Background");
              
            }  else if (command == "SFX") {
              sfx(line);
              
            }  else if (command == "USE") {
              use(line);
              
            }  else if (command == "GIVE") {
              give(line);
              
            }  else {
              Sup.log("Error in cutscene '" + sceneName + "': bad line at line " + lineIdx);
            }
            
          }
          
        }
        
         /**
         * Set the current display actor for one side of the cutscene
         * 
         * @method enter
         * @param side {string} Either "RIGHT" or "LEFT"
         * @param art {string} Entry name from the CharacterList file
         * @private
         */
        function enter(side: string, art: string) {
          art = CharacterList.getSprite(art);
          if (side == "LEFT") {
            leftImage = art;
            leftActor.spriteRenderer.setSprite(leftImage);
            leftActor.setVisible(true);
          } else if (side == "RIGHT") {
            rightImage = art;
            rightActor.spriteRenderer.setSprite(rightImage);
            rightActor.setVisible(true);
          } else {
            Sup.log("Error in cutscene '" + sceneName + "': bad ENTER command at line " + lineIdx);
          }
        }
        
        /***
         * Set the current animation for one of the current actors in the cutscene
         * 
         * @method animate
         * @param side {string} Either "RIGHT" or "LEFT"
         * @param anim {string} Name of an animation in the character sprite
         * @private
         */
        function animate(side: string, anim: string) {
          if (side == "LEFT") {
            leftActor.spriteRenderer.setAnimation(anim);
          } else if (side == "RIGHT") {
            rightActor.spriteRenderer.setAnimation(anim);
          } else {
            Sup.log("Error in cutscene '" + sceneName + "': bad ANIMATE command at line " + lineIdx);
          }
        }
        
        /***
         * Display a basic dialog with a given faceset
         * 
         * @method speak
         * @param faceSet {string} Name of the face set to show
         * @param text {string} The text to be displayed in the dialog
         * @private
         */
        function speak(faceSet: string, text: string) {
          waitingForDialog = true;
          Game.dialogBehavior.showRaw(faceSet, text, null, null, null);
        }
        
        /***
         * Clear one or both of the cutscene actors.
         * 
         * @method exit
         * @param side {string} Either "RIGHT" or "LEFT" or "BOTH"
         * @private
         */
        function exit(side: string) {
          if (side == "LEFT") {
            leftImage = "Blank";
            leftActor.spriteRenderer.setSprite(leftImage);
            leftActor.setVisible(false);
          } else if (side == "RIGHT") {
            rightImage = "Blank";
            rightActor.spriteRenderer.setSprite(rightImage);
            rightActor.setVisible(false);
          } else if (side == "BOTH") {
            leftImage = "Blank";
            leftActor.spriteRenderer.setSprite(leftImage);
            leftActor.setVisible(false);
            rightImage = "Blank";
            rightActor.spriteRenderer.setSprite(rightImage);
            rightActor.setVisible(false);
          } else {
            Sup.log("Error in cutscene '" + sceneName + "': bad ENTER command at line " + lineIdx);
          }
        }
        
        /***
         * Add an item to inventory
         * 
         * @method give
         * @param item {string} Name of the item to add
         * @private
         */
        function give(item: string) {
          Game.getItem(item);
        }
        
        /***
         * Use an item from inventory
         * 
         * @method use
         * @param item {string} Name of the item to add
         * @private
         */
        function use(item: string) {
          Game.useItem(item);
        }
        
        /***
         * Play a sound effect and wait for it to finish
         * 
         * @method sfx
         * @param sound {string} Name of the effect to play
         * @private
         */
        function sfx(sound: string) {
          playingSound = new Sup.Audio.SoundPlayer(Sup.get("SFX/"+sound, Sup.Sound));
          playingSound.play();
          waitingForSound = true;
        }
        
        /***
         * Transition ot another scene
         * 
         * @method scene
         * @param name {string} Path to the scene
         * @param target {string} Target actor on which to center the camera in the new scene
         * @private
         */
        function scene(name: string, target: string) {
          fdBehavior = null; //Don't try to call back to destroyed actor!
          Game.cameraBehavior.transitionToScene(name, target);
        }
        
        /***
         * Load and run another cutscene script
         * 
         * @method load
         * @param sound {string} Name of the script to load
         * @private
         */
        function load(name: string) {
          Cutscene.loadScript(name, fdBehavior);
        }
        
        /***
         * Load and run another cutscene script IF the player has a certain item.
         * Anything after this call is inherently the "else" clause
         * 
         * @method load
         * @param item {string} Name of the item to check for
         * @param sound {string} Name of the script to load
         * @private
         */
        function loadifitem(item:string, name: string) {
          if (Game.hasItem(item)) Cutscene.loadScript(name, fdBehavior);
        }
        
        /***
         * Display a dialog with two choices and load a new script depending on the choice selected.
         * Always results in a LOAD command, so any lines after this call will never be reached
         * 
         * @method load
         * @param faceset {string} face to display on the dialog
         * @param args {string} A string of five '|'-separated arguments:
         *    1) The name of the script to load if the first choice is selected
         *    2) The name of the script to load if the second choice is selected
         *    3) The text to display in the dialog
         *    4) The text of the first choice
         *    5) The text of the second choice
         * @private
         */
        function branch(faceSet: string, args: string){
          var argArray = args.split('|');
          if (argArray.length == 5) {
            branchA = argArray[0];
            branchB = argArray[1];
            var dText = argArray[2];
            var cText1 = argArray[3];
            var cText2 = argArray[4];
            
            this["finishDialog"] = function(textId: string, choiceid: string) {
              if(choiceid == "0") load(branchA)
              else if(choiceid == "1") load(branchB)
            };
            
            waitingForDialog = true;
            Game.dialogBehavior.showRaw(faceSet, dText, ["0","1"], [cText1,cText2], this);
            
          } else {
            Sup.log("Error in cutscene '" + sceneName + "': bad BRANCH command at line " + lineIdx);
          }
        }
}