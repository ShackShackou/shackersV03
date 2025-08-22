using Godot;
using System;

public partial class HalloweenCreatureController : SpineSprite
{
	
	// This creates a dropdown list of skin names in the inspector
	public enum SkinOption
	{
		Frank,
		Witch,
		Pumpkin,
		Skull
	}
	
	// This stores the selection from the dropdown list as a varable called SkinSelection
	[Export] public SkinOption SkinSelection { get; set; } = SkinOption.Frank;

	// Make a checkbox that determines if the sprite will bounce or just sit still. By default it bounces.
	[Export] public bool BouncyIdle = true; 
	
	// Make a checkbox that enables testing by pressing A, H, D, I and J keys to play animations
	[Export] public bool TestingKeysEnabled = true; 
	
	
	// Some private variables the script needs to run
	private string _idleAnim = "idle";
	private bool _isKeyPressed = false;
	
	
	// Called when the node enters the scene tree for the first time.
	public override void _Ready()
	{
		// This switch case staement translates the skin selection to a string, which is the 
		// type of variable we need to set the skin on the Spine2D animation
		string curSkinName = "";
		switch (SkinSelection)
		{
			case SkinOption.Frank:
				curSkinName = "frank";
				break;
			case SkinOption.Witch:
				curSkinName = "witch";
				break;
			case SkinOption.Pumpkin:
				curSkinName = "pumpkin";
				break;
			case SkinOption.Skull:
				curSkinName = "skull";
				break;
		}
		SetSkin(curSkinName);

		
		// set the idle animation based on the bouncy checkbox, and make sure the default mix time is set
		_idleAnim = BouncyIdle ? "idle" : "still";
		GetAnimationState().SetAnimation(_idleAnim, true);
		SpineSkeletonDataResource skelData = GetSkeleton().GetData();
		skelData.SetDefaultMix(0.05f);
		
	}

	// Called every frame. 'delta' is the elapsed time since the previous frame.
	public override void _Process(double delta)
	{
		if (TestingKeysEnabled)
		{

			// A very simple conditional check if any of the testing hotkeys are pressed

			if (Input.IsKeyPressed(Key.A))
			{
				if (!_isKeyPressed) ShowAttack();
				_isKeyPressed = true;
			} 
			else if (Input.IsKeyPressed(Key.H))
			{
				if (!_isKeyPressed) ShowHurt();
				_isKeyPressed = true;
			}
			else if (Input.IsKeyPressed(Key.D))
			{
				if (!_isKeyPressed) ShowDie();
				_isKeyPressed = true;
			}
			else if (Input.IsKeyPressed(Key.I))
			{
				if (!_isKeyPressed) ShowIdle();
				_isKeyPressed = true;
			}
			else if (Input.IsKeyPressed(Key.J))
			{
				if (!_isKeyPressed) ShowInvisible();
				_isKeyPressed = true;
			}
			else
			{
				_isKeyPressed = false;
			}

			
		}
	}

	// Use this method if you would like to set the skin using code instead of the drop-down 
	public void SetSkin(string skinName)
	{
		// It takes several steps to define a skin and apply it to a Spine2D skeleton
		// It's not intuitive, so I always just google "Spine Godot API" for the documentation
		// The examples are all in GDScript and I prefer C#, but it's close enough
		SpineSkeleton skel = GetSkeleton();
		SpineSkin skin = NewSkin("theNewSkin");
		var data = skel.GetData();
		skin.AddSkin(data.FindSkin(skinName));
		skel.SetSkin(skin);
		skel.SetSlotsToSetupPose();
	}

	
	// Method for playing the attack animation
	public void ShowAttack()
	{
		GetAnimationState().SetAnimation("attack", false);
		GetAnimationState().AddAnimation(_idleAnim, 0f, true);
	}
	
	
	// Method for playing the hurt/take damage animation
	public void ShowHurt()
	{
		GetAnimationState().SetAnimation("hurt", false);
		GetAnimationState().AddAnimation(_idleAnim, 0f, true);
	}

	
	// Method for playing the die animation
	public void ShowDie()
	{
		GetAnimationState().SetAnimation("die", false);
	}

	
	// Method for returning to the idle animation
	public void ShowIdle()
	{
		GetAnimationState().SetAnimation("idle", true);
	}
	
	
	// Method for playing an animation that just makes the character invisible
	public void ShowInvisible()
	{
		GetAnimationState().SetAnimation("invisible", true);
	}
	
	
}
