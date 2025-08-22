Spine2D Halloween Creatures by Chris Gortz


INSTALLING GODOT WITH SPINE

Unlike other code libraries, Spine2D support cannot be added to an existing Godot project by installing a plugin or just adding files. You need to download a precompiled version of the Godot editor that supports Spine. Luckily, this is easy, and once you have the Spine version of Godot it's just a matter of launching the app and opening your project as you would normally.

Download the Godot editor with Spine support that matches your platform and version here:
https://en.esotericsoftware.com/spine-godot



USING THE ANIMATION IN A PROJECT

There is a video guide for importing and setting up the assets here:
https://vimeo.com/1015085952

The asset folder includes a c# script called
HalloweenCreatureController.cs 

The script is heavily commented, but the short version is this: When testing the scene with the animation in it, you can play specific animations by pressing testing keys.

A = Attack
H = Hurt
D = Die
I = Idle
J = Invisible

You can disable the keys by unchecking 'Testing Keys Enabled' in the editor. 

By unchecking 'Bouncy Idle' in the inspector, you can change from the default bouncing animation to an idle state where the character barely moves.  

Triggering the animations in code can be done by calling the methods

ShowAttack()
ShowHurt()
ShowDie()
ShowIdle() 	*Great for resuming life after the die animation
ShowInvisible()

You can also change the skins in code by calling
'SetSkin(string skinName)'

The strings for the skins are
frank
witch
pumpkin
skull



The assets are meant for game jam/educational/personal projects. If you do use these animations in a project, please show me! Just contact me wherever you downloaded the assets from.