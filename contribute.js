const form=document.getElementById('contribution-form');
const id=document.getElementById('submission-id');
id.value='HAWES-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36));
form.addEventListener('submit',event=>{
 const files=[...form.querySelectorAll('input[type=file]')].flatMap(input=>[...input.files]);
 const error=document.getElementById('form-error');
 const allowed=['image/jpeg','image/png','image/webp','application/pdf'];
 let message=form.dataset.deliveryPending==='true'?'This is a preview. Sending will be available once setup is complete.':'';
 if(files.some(file=>!allowed.includes(file.type))) message='Please choose JPG, PNG, WebP or PDF files.';
 if(files.reduce((size,file)=>size+file.size,0)>=10000000) message='Please keep the total file size below 10 MB, or send fewer files at a time.';
 error.hidden=!message;error.textContent=message;
 if(message){event.preventDefault();error.scrollIntoView({block:'center'});}
});
