// V1.5-r13 compact offline QR encoder for eight-character invitation codes.
(()=>{
  const EXP=new Array(512),LOG=new Array(256);
  let value=1;
  for(let i=0;i<255;i++){EXP[i]=value;LOG[value]=i;value<<=1;if(value&0x100)value^=0x11d;}
  for(let i=255;i<512;i++)EXP[i]=EXP[i-255];
  const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
  function polyMul(a,b){
    const out=new Array(a.length+b.length-1).fill(0);
    for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)out[i+j]^=mul(a[i],b[j]);
    return out;
  }
  function rsEcc(data,degree=7){
    let generator=[1];
    for(let i=0;i<degree;i++)generator=polyMul(generator,[1,EXP[i]]);
    const remainder=data.concat(new Array(degree).fill(0));
    for(let i=0;i<data.length;i++){
      const factor=remainder[i];
      if(!factor)continue;
      for(let j=1;j<generator.length;j++)remainder[i+j]^=mul(generator[j],factor);
    }
    return remainder.slice(-degree);
  }
  function payloadBytes(text){
    return Array.from(new TextEncoder().encode(String(text||''))).slice(0,8);
  }
  function codewords(text){
    const bytes=payloadBytes(text);
    let bits='0100'+bytes.length.toString(2).padStart(8,'0');
    for(const byte of bytes)bits+=byte.toString(2).padStart(8,'0');
    bits+=('0'.repeat(Math.min(4,152-bits.length)));
    bits+='0'.repeat((8-bits.length%8)%8);
    const out=[];
    for(let i=0;i<bits.length;i+=8)out.push(parseInt(bits.slice(i,i+8),2));
    for(let pad=0;out.length<19;pad++)out.push(pad%2?0x11:0xec);
    return out;
  }
  function formatBits(){
    const data=0b01000;
    let rem=data<<10;
    for(let i=14;i>=10;i--)if(rem&(1<<i))rem^=0x537<<(i-10);
    return ((data<<10)|rem)^0x5412;
  }
  function qrMatrix(text){
    const size=21,modules=Array.from({length:size},()=>new Array(size).fill(false)),reserved=Array.from({length:size},()=>new Array(size).fill(false));
    const set=(row,col,dark)=>{modules[row][col]=!!dark;reserved[row][col]=true;};
    function finder(top,left){
      for(let dy=-1;dy<=7;dy++)for(let dx=-1;dx<=7;dx++){
        const row=top+dy,col=left+dx;
        if(row<0||row>=size||col<0||col>=size)continue;
        const distance=Math.max(Math.abs(dx-3),Math.abs(dy-3));
        set(row,col,distance!==2&&distance!==4);
      }
    }
    finder(0,0);finder(0,size-7);finder(size-7,0);
    for(let i=8;i<size-8;i++){set(6,i,i%2===0);set(i,6,i%2===0);}
    for(let i=0;i<=8;i++){if(!reserved[8][i])set(8,i,false);if(!reserved[i][8])set(i,8,false);}
    for(let i=size-8;i<size;i++){if(!reserved[8][i])set(8,i,false);if(!reserved[i][8])set(i,8,false);}
    const data=codewords(text),all=data.concat(rsEcc(data,7)),bits=[];
    for(const byte of all)for(let bit=7;bit>=0;bit--)bits.push((byte>>bit)&1);
    let index=0;
    for(let right=size-1;right>0;right-=2){
      if(right===6)right--;
      const upward=((right+1)&2)===0;
      for(let offset=0;offset<size;offset++){
        const row=upward?size-1-offset:offset;
        for(let column=0;column<2;column++){
          const col=right-column;
          if(reserved[row][col])continue;
          const raw=index<bits.length?bits[index++]:0;
          modules[row][col]=Boolean(raw^((row+col)%2===0?1:0));
        }
      }
    }
    const format=formatBits();
    const bit=i=>(format>>i)&1;
    for(let i=0;i<=5;i++)set(i,8,bit(i));
    set(7,8,bit(6));set(8,8,bit(7));set(8,7,bit(8));
    for(let i=9;i<15;i++)set(8,14-i,bit(i));
    for(let i=0;i<8;i++)set(8,size-1-i,bit(i));
    for(let i=8;i<15;i++)set(size-15+i,8,bit(i));
    set(size-8,8,true);
    return modules;
  }
  function canvas(text,scale=12,quiet=4){
    const matrix=qrMatrix(text),size=matrix.length,canvas=document.createElement('canvas');
    canvas.width=canvas.height=(size+quiet*2)*scale;
    const context=canvas.getContext('2d');
    context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
    context.fillStyle='#102d24';
    matrix.forEach((row,y)=>row.forEach((dark,x)=>{if(dark)context.fillRect((x+quiet)*scale,(y+quiet)*scale,scale,scale);}));
    return canvas;
  }
  function download(text,filename){
    const image=canvas(text);
    return new Promise((resolve,reject)=>{
      image.toBlob(blob=>{
        if(!blob){reject(Error('二维码图片生成失败'));return;}
        const link=document.createElement('a'),url=URL.createObjectURL(blob);
        link.href=url;link.download=filename;link.click();
        setTimeout(()=>URL.revokeObjectURL(url),1200);resolve({payload:String(text),width:image.width,height:image.height});
      },'image/png');
    });
  }
  window.G13QR={matrix:qrMatrix,canvas,download};
})();
