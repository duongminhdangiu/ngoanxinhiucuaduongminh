/* Dashboard bổ sung. Không sửa hoặc thay thế bất cứ logic nào trong script gốc. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const dialog = $('dashDialog');
  const title = $('dashDialogTitle');
  const body = $('dashDialogBody');
  const login = $('dashLoginForm');
  const feedback = $('dashFeedback');
  const storageKey = 'loveDashboardCredentialsV1';
  const rememberKey = 'loveDashboardRememberV1';
  // Tài khoản mặc định của bản demo; đổi bằng Tài khoản > Đổi thông tin đăng nhập.
  const defaults = {username:'trinh', password:'Minh@2024!'};
  let loggedIn = false;
  const credentials = () => {
    try {return {...defaults,...JSON.parse(localStorage.getItem(storageKey) || '{}')};}
    catch {return {...defaults};}
  };
  function openDialog(heading, render) {
    title.textContent=heading;
    body.replaceChildren();
    render(body);
    if (!dialog.open) dialog.showModal();
  }
  function node(tag, text, className) {
    const element=document.createElement(tag);
    if(text!==undefined) element.textContent=text;
    if(className) element.className=className;
    return element;
  }
  function paragraph(parent,text){parent.append(node('p',text));}
  function action(parent,label,handler,secondary=false){
    const button=node('button',label,'dash-action'+(secondary?' secondary':''));
    button.type='button';button.addEventListener('click',handler);parent.append(button);
  }
  function goTo(id, initializer){
    if(!loggedIn){dialog.close();feedback.textContent='Vui lòng đăng nhập để mở chức năng này.';$('dashUsername').focus();return;}
    dialog.close();
    if(typeof show==='function') show(id);
    else {document.querySelectorAll('.step').forEach(el=>el.classList.remove('active'));$(id).classList.add('active');}
    if(initializer) initializer();
  }
  function settings(){
    openDialog('Tài khoản & cài đặt', parent=>{
      paragraph(parent,loggedIn?'Đã đăng nhập. Bạn có thể cập nhật tên đăng nhập và mật khẩu của dashboard.':'Bạn có thể đăng nhập hoặc thay đổi thông tin sau khi xác minh mật khẩu hiện tại.');
      const form=node('form');
      form.innerHTML='<label>Tên đăng nhập mới<input name="newUser" required minlength="2" autocomplete="off"></label><label>Mật khẩu hiện tại<input name="oldPass" type="password" required autocomplete="current-password"></label><label>Mật khẩu mới<input name="newPass" type="password" required minlength="8" autocomplete="new-password"></label><label>Xác nhận mật khẩu mới<input name="confirmPass" type="password" required minlength="8" autocomplete="new-password"></label><button class="dash-action" type="submit">Lưu thay đổi</button><p class="dash-dialog-msg" role="status"></p>';
      form.elements.newUser.value=credentials().username;
      form.addEventListener('submit',event=>{
        event.preventDefault();const f=form.elements;const msg=form.querySelector('.dash-dialog-msg');
        if(f.oldPass.value!==credentials().password){msg.textContent='Mật khẩu hiện tại chưa đúng.';return;}
        if(f.newPass.value!==f.confirmPass.value){msg.textContent='Mật khẩu xác nhận chưa khớp.';return;}
        try {localStorage.setItem(storageKey,JSON.stringify({username:f.newUser.value.trim(),password:f.newPass.value}));
          msg.textContent='Đã lưu thông tin trên trình duyệt này.';$('dashUsername').value=f.newUser.value.trim();f.reset();}
        catch {msg.textContent='Trình duyệt không cho phép lưu. Vui lòng kiểm tra chế độ riêng tư.';}
      });
      parent.append(form);
      if(loggedIn)action(parent,'Đăng xuất',()=>{loggedIn=false;dialog.close();feedback.textContent='Đã đăng xuất.';},true);
    });
  }
  function search(){
    const term=$('dashSearch').value.trim().toLowerCase();
    const matches=features.filter(f=>(f.title+' '+f.description).toLowerCase().includes(term));
    openDialog('Kết quả tìm kiếm',parent=>{
      paragraph(parent,term?`Từ khóa: ${$('dashSearch').value.trim()}`:'Các chức năng hiện có:');
      (term?matches:features).forEach(f=>action(parent,f.title,()=>feature(f.key)));
      if(term&&!matches.length)paragraph(parent,'Chưa tìm thấy chức năng phù hợp. Thử “ảnh”, “thư”, “video”, “quiz” hoặc “tài khoản”.');
    });
  }
  const features=[
    {key:'parents',title:'Phụ huynh · Scrapbook',description:'Khoảnh khắc kỷ niệm và phần giới thiệu'},
    {key:'students',title:'Sinh viên · Câu hỏi',description:'Quiz tương tác và những câu hỏi có sẵn'},
    {key:'alumni',title:'Cựu sinh viên · Bức thư',description:'Bức thư và album ảnh hiện có'},
    {key:'staff',title:'Cán bộ · Video',description:'Video bí mật, tua và đóng video'},
    {key:'business',title:'Doanh nghiệp · Photobooth',description:'Chụp ảnh, chọn khung, tải ảnh'}
  ];
  function feature(key){
    const f=features.find(x=>x.key===key);if(!f)return;
    openDialog(f.title,parent=>{
      paragraph(parent,f.description+'.');
      if(key==='parents')action(parent,'Mở scrapbook',()=>goTo('stepIntro',()=>typeof startTypingIntro==='function'&&startTypingIntro()));
      if(key==='students')action(parent,'Mở câu hỏi',()=>goTo('stepQuiz',()=>typeof startQuiz==='function'&&startQuiz()));
      if(key==='alumni')action(parent,'Mở bức thư',()=>goTo('stepLetter',()=>typeof startTypingLetter==='function'&&startTypingLetter()));
      if(key==='staff')action(parent,'Xem video',()=>{if(!loggedIn){dialog.close();feedback.textContent='Hãy đăng nhập trước.';return;}dialog.close();$('tvIcon').click();});
      if(key==='business')action(parent,'Mở photobooth',()=>goTo('stepPhotobooth',()=>{
        if(!navigator.mediaDevices?.getUserMedia){$('pb-status').textContent='Camera cần localhost hoặc HTTPS và quyền truy cập camera.';return;}
        navigator.mediaDevices.getUserMedia({video:true}).then(stream=>{$('pb-video').srcObject=stream;}).catch(()=>{$('pb-status').textContent='Vui lòng cấp quyền camera.';});
      }));
      action(parent,'Quay về dashboard',()=>dialog.close(),true);
    });
  }
  function stats(){openDialog('Thống kê chức năng',parent=>{
    paragraph(parent,'Dashboard hiện có 5 nhóm chức năng: scrapbook, quiz, bức thư, video và photobooth.');
    paragraph(parent,'Trạng thái đăng nhập: '+(loggedIn?'Đã đăng nhập':'Chưa đăng nhập'));
    paragraph(parent,'Các nội dung và dữ liệu trong từng bước được giữ nguyên từ code gốc.');
  });}
  function dispatch(key){
    if(key==='home'){$('dashSearch').value='';feedback.textContent='Đang ở trang chủ.';return;}
    if(key==='search'){search();return;}
    if(key==='stats'){stats();return;}
    if(key==='account'){settings();return;}
    feature(key);
  }
  document.querySelectorAll('#stepDashboard [data-action]').forEach(button=>button.addEventListener('click',()=>dispatch(button.dataset.action)));
  $('dashSearchBtn').addEventListener('click',search);
  $('dashSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
  $('dashLoginToggle').addEventListener('click',()=>{$('dashUsername').focus();feedback.textContent='Nhập tài khoản để tiếp tục.';});
  $('dashTheme').addEventListener('click',()=>{document.querySelector('.love-scene').classList.toggle('dimmed');});
  $('dashHeart').addEventListener('click',()=>{
    if(typeof confetti==='function')confetti({particleCount:65,spread:75,origin:{x:.9,y:.12},colors:['#ff4d6d','#ffd0df','#ffffff']});
    feedback.textContent='Một trái tim dành cho bạn!';
  });
  $('dashShowPassword').addEventListener('click',()=>{$('dashPassword').type=$('dashPassword').type==='password'?'text':'password';});
  $('dashRememberHit').addEventListener('click',()=>{$('dashRemember').checked=!$('dashRemember').checked;});
  $('dashForgot').addEventListener('click',()=>openDialog('Quên mật khẩu',parent=>{
    paragraph(parent,'Đây là trang đăng nhập mô phỏng chạy ngay trong trình duyệt. Để đổi mật khẩu, hãy xác minh mật khẩu hiện tại trong phần Tài khoản.');
    action(parent,'Mở cài đặt tài khoản',settings);
  }));
  login.addEventListener('submit',e=>{
    e.preventDefault();const c=credentials();
    if($('dashUsername').value.trim()!==c.username||$('dashPassword').value!==c.password){feedback.textContent='Tên đăng nhập hoặc mật khẩu chưa đúng.';return;}
    loggedIn=true;feedback.textContent='Đăng nhập thành công! Đang mở trải nghiệm...';
    try {if($('dashRemember').checked)localStorage.setItem(rememberKey,c.username);else localStorage.removeItem(rememberKey);}catch{}
    setTimeout(()=>{document.getElementById('stepDashboard').classList.remove('active');
      // Giữ nguyên mã PIN và các bước tiếp theo trong bản gốc.
      if(typeof show==='function')show('stepPassword');else $('stepPassword').classList.add('active');
    },600);
  });
  try {const saved=localStorage.getItem(rememberKey);if(saved)$('dashUsername').value=saved;}catch{}
})();
