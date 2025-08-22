export class LoginModal {
  private scene: Phaser.Scene;
  private onSubmit: (email: string, password: string) => void;
  
  constructor(scene: Phaser.Scene, onSubmit: (email: string, password: string) => void) {
    this.scene = scene;
    this.onSubmit = onSubmit;
  }

  show(isRegister: boolean = false) {
    // Create overlay div
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #2a2a2a;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      width: 300px;
      color: white;
      font-family: Arial, sans-serif;
    `;

    modal.innerHTML = `
      <h2 style="margin: 0 0 20px 0; color: #00ff88;">${isRegister ? 'Create Account' : 'Sign In'}</h2>
      <form id="loginForm">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Email:</label>
          <input type="email" id="email" required style="
            width: 100%;
            padding: 8px;
            background: #1a1a1a;
            border: 1px solid #444;
            color: white;
            border-radius: 4px;
            box-sizing: border-box;
          ">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Password:</label>
          <input type="password" id="password" required style="
            width: 100%;
            padding: 8px;
            background: #1a1a1a;
            border: 1px solid #444;
            color: white;
            border-radius: 4px;
            box-sizing: border-box;
          ">
        </div>
        ${isRegister ? `
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Username:</label>
          <input type="text" id="username" required style="
            width: 100%;
            padding: 8px;
            background: #1a1a1a;
            border: 1px solid #444;
            color: white;
            border-radius: 4px;
            box-sizing: border-box;
          ">
        </div>
        ` : ''}
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="submit" style="
            flex: 1;
            padding: 10px;
            background: #00ff88;
            border: none;
            color: black;
            font-weight: bold;
            cursor: pointer;
            border-radius: 4px;
          ">${isRegister ? 'Create' : 'Login'}</button>
          <button type="button" id="cancelBtn" style="
            flex: 1;
            padding: 10px;
            background: #ff4444;
            border: none;
            color: white;
            font-weight: bold;
            cursor: pointer;
            border-radius: 4px;
          ">Cancel</button>
        </div>
      </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Handle form submission
    const form = document.getElementById('loginForm') as HTMLFormElement;
    form.onsubmit = (e) => {
      e.preventDefault();
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      const username = isRegister ? (document.getElementById('username') as HTMLInputElement)?.value : '';
      
      document.body.removeChild(overlay);
      
      if (isRegister) {
        this.onSubmit(email, password + '|REG|' + username);
      } else {
        this.onSubmit(email, password);
      }
    };

    // Handle cancel
    document.getElementById('cancelBtn')!.onclick = () => {
      document.body.removeChild(overlay);
    };

    // Focus email field
    (document.getElementById('email') as HTMLInputElement).focus();
  }
}
