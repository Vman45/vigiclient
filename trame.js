const TRAME0 = "$".charCodeAt();
const TRAME1R = "R".charCodeAt();

function constrain(n, nMin, nMax) {
 if(n > nMax)
  n = nMax;
 else if(n < nMin)
  n = nMin;

 return n;
}

function mapFloat(n, inMin, inMax, outMin, outMax) {
 return (n - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function mapTrunc(n, inMin, inMax, outMin, outMax) {
 return Math.trunc(mapFloat(n, inMin, inMax, outMin, outMax));
}

class Tx {
 constructor(conftx) {
  this.conftx = conftx;

  let nb32 = conftx.COMMANDES32.length;
  let nb16 = conftx.COMMANDES16.length;
  let nb8 = conftx.SYNC.length + conftx.CHOIXCAMERAS.length + conftx.COMMANDES8.length;

  this.byteLength = nb32 * 4 + nb16 * 2 + nb8 + Math.ceil(conftx.COMMANDES1.length / 8);
  this.arrayBuffer = new ArrayBuffer(this.byteLength);

  let p = 0;
  this.sync = new Uint8Array(this.arrayBuffer, p, conftx.SYNC.length);
  p += this.sync.byteLength;
  for(let i = 0; i < conftx.SYNC.length; i++)
   this.sync[i] = conftx.SYNC[i].charCodeAt();

  this.commandesUint32 = new Uint32Array(this.arrayBuffer, p, conftx.COMMANDES32.length);
  this.commandesInt32 = new Int32Array(this.arrayBuffer, p, conftx.COMMANDES32.length);
  p += this.commandesUint32.byteLength;
  for(let i = 0; i < conftx.COMMANDES32.length; i++)
   this.setFloatCommande32(i, conftx.COMMANDES32[i].INIT);

  this.commandesUint16 = new Uint16Array(this.arrayBuffer, p, conftx.COMMANDES16.length);
  this.commandesInt16 = new Int16Array(this.arrayBuffer, p, conftx.COMMANDES16.length);
  p += this.commandesUint16.byteLength;
  for(let i = 0; i < conftx.COMMANDES16.length; i++)
   this.setFloatCommande16(i, conftx.COMMANDES16[i].INIT);

  this.choixCameras = new Uint8Array(this.arrayBuffer, p, conftx.CHOIXCAMERAS.length);
  p += this.choixCameras.byteLength;
  for(let i = 0; i < conftx.CHOIXCAMERAS.length; i++)
   this.choixCameras[i] = conftx.CHOIXCAMERAS[i];

  this.commandesUint8 = new Uint8Array(this.arrayBuffer, p, conftx.COMMANDES8.length);
  this.commandesInt8 = new Int8Array(this.arrayBuffer, p, conftx.COMMANDES8.length);
  p += this.commandesUint8.byteLength;
  for(let i = 0; i < conftx.COMMANDES8.length; i++)
   this.setFloatCommande8(i, conftx.COMMANDES8[i].INIT);

  this.commandes1 = new Uint8Array(this.arrayBuffer, p, Math.ceil(conftx.COMMANDES1.length / 8));
  p += this.commandes1.byteLength;
  for(let i = 0; i < conftx.COMMANDES1.length; i++)
   this.setCommande1(i, conftx.COMMANDES1[i].INIT);

  this.bytes = new Uint8Array(this.arrayBuffer);
 }

 setCommande32(id, valeur) {
  if(this.conftx.COMMANDES32[id].SIGNE)
   this.commandesInt32[id] = valeur;
  else
   this.commandesUint32[id] = valeur;
 }

 setCommande16(id, valeur) {
  if(this.conftx.COMMANDES16[id].SIGNE)
   this.commandesInt16[id] = valeur;
  else
   this.commandesUint16[id] = valeur;
 }

 setCommande8(id, valeur) {
  if(this.conftx.COMMANDES8[id].SIGNE)
   this.commandesInt8[id] = valeur;
  else
   this.commandesUint8[id] = valeur;
 }

 setCommande1(id, valeur) {
  let pos = Math.trunc(id / 8);

  if(valeur)
   this.commandes1[pos] |= 1 << id % 8;
  else
   this.commandes1[pos] &= ~(1 << id % 8);
 }

 getCommande32(id) {
  let valeur;

  if(this.conftx.COMMANDES32[id].SIGNE)
   valeur = this.commandesInt32[id];
  else
   valeur = this.commandesUint32[id];

  return valeur;
 }

 getCommande16(id) {
  let valeur;

  if(this.conftx.COMMANDES16[id].SIGNE)
   valeur = this.commandesInt16[id];
  else
   valeur = this.commandesUint16[id];

  return valeur;
 }

 getCommande8(id) {
  let valeur;

  if(this.conftx.COMMANDES8[id].SIGNE)
   valeur = this.commandesInt8[id];
  else
   valeur = this.commandesUint8[id];

  return valeur;
 }

 getCommande1(id) {
  let pos = Math.trunc(id / 8);

  return this.commandes1[pos] >> id % 8 & 1;
 }

 computeRawCommande32(id, valeur) {
  let min;
  let max;

  if(this.conftx.COMMANDES32[id].SIGNE) {
   min = -2147483647;
   max = 2147483647;
  } else {
   min = 0;
   max = 4294967295;
  }
  valeur = constrain(valeur, this.conftx.COMMANDES32[id].ECHELLEMIN, this.conftx.COMMANDES32[id].ECHELLEMAX);
  valeur = mapTrunc(valeur, this.conftx.COMMANDES32[id].ECHELLEMIN, this.conftx.COMMANDES32[id].ECHELLEMAX, min, max);

  return valeur;
 }

 computeRawCommande16(id, valeur) {
  let min;
  let max;

  if(this.conftx.COMMANDES16[id].SIGNE) {
   min = -32767;
   max = 32767;
  } else {
   min = 0;
   max = 65535;
  }
  valeur = constrain(valeur, this.conftx.COMMANDES16[id].ECHELLEMIN, this.conftx.COMMANDES16[id].ECHELLEMAX);
  valeur = mapTrunc(valeur, this.conftx.COMMANDES16[id].ECHELLEMIN, this.conftx.COMMANDES16[id].ECHELLEMAX, min, max);

  return valeur;
 }

 computeRawCommande8(id, valeur) {
  let min;
  let max;

  if(this.conftx.COMMANDES8[id].SIGNE) {
   min = -127;
   max = 127;
  } else {
   min = 0;
   max = 255;
  }
  valeur = constrain(valeur, this.conftx.COMMANDES8[id].ECHELLEMIN, this.conftx.COMMANDES8[id].ECHELLEMAX);
  valeur = mapTrunc(valeur, this.conftx.COMMANDES8[id].ECHELLEMIN, this.conftx.COMMANDES8[id].ECHELLEMAX, min, max);

  return valeur;
 }

 setFloatCommande32(id, valeur) {
  valeur = this.computeRawCommande32(id, valeur);
  this.setCommande32(id, valeur);
 }

 setFloatCommande16(id, valeur) {
  valeur = this.computeRawCommande16(id, valeur);
  this.setCommande16(id, valeur);
 }

 setFloatCommande8(id, valeur) {
  valeur = this.computeRawCommande8(id, valeur);
  this.setCommande8(id, valeur);
 }

 getFloatCommande32(id) {
  let valeur;

  if(this.conftx.COMMANDES32[id].SIGNE)
   valeur = mapFloat(this.commandesInt32[id], -2147483648, 2147483648, this.conftx.COMMANDES32[id].ECHELLEMIN, this.conftx.COMMANDES32[id].ECHELLEMAX);
  else
   valeur = mapFloat(this.commandesUint32[id], 0, 4294967295, this.conftx.COMMANDES32[id].ECHELLEMIN, this.conftx.COMMANDES32[id].ECHELLEMAX);

  return valeur;
 }

 getFloatCommande16(id) {
  let valeur;

  if(this.conftx.COMMANDES16[id].SIGNE)
   valeur = mapFloat(this.commandesInt16[id], -32768, 32768, this.conftx.COMMANDES16[id].ECHELLEMIN, this.conftx.COMMANDES16[id].ECHELLEMAX);
  else
   valeur = mapFloat(this.commandesUint16[id], 0, 65535, this.conftx.COMMANDES16[id].ECHELLEMIN, this.conftx.COMMANDES16[id].ECHELLEMAX);

  return valeur;
 }

 getFloatCommande8(id) {
  let valeur;

  if(this.conftx.COMMANDES8[id].SIGNE)
   valeur = mapFloat(this.commandesInt8[id], -128, 128, this.conftx.COMMANDES8[id].ECHELLEMIN, this.conftx.COMMANDES8[id].ECHELLEMAX);
  else
   valeur = mapFloat(this.commandesUint8[id], 0, 255, this.conftx.COMMANDES8[id].ECHELLEMIN, this.conftx.COMMANDES8[id].ECHELLEMAX);

  return valeur;
 }
}

class Rx {
 constructor(conftx, confrx) {
  this.conftx = conftx;
  this.confrx = confrx;
  this.pos = 0;

  let nb32 = conftx.COMMANDES32.length + confrx.VALEURS32.length;
  let nb16 = conftx.COMMANDES16.length + confrx.VALEURS16.length;
  let nb8 = confrx.SYNC.length + conftx.CHOIXCAMERAS.length +
            conftx.COMMANDES8.length + confrx.VALEURS8.length;

  this.byteLength = nb32 * 4 + nb16 * 2 + nb8 + Math.ceil(conftx.COMMANDES1.length / 8);
  this.arrayBuffer = new ArrayBuffer(this.byteLength);

  let p = 0;
  this.sync = new Uint8Array(this.arrayBuffer, p, confrx.SYNC.length);
  p += this.sync.byteLength;
  for(let i = 0; i < confrx.SYNC.length; i++)
   this.sync[i] = confrx.SYNC[i].charCodeAt();

  this.commandesUint32 = new Uint32Array(this.arrayBuffer, p, conftx.COMMANDES32.length);
  this.commandesInt32 = new Int32Array(this.arrayBuffer, p, conftx.COMMANDES32.length);
  p += this.commandesUint32.byteLength;
  for(let i = 0; i < conftx.COMMANDES32.length; i++)
   this.setFloatCommande32(i, conftx.COMMANDES32[i].INIT);

  this.valeursUint32 = new Uint32Array(this.arrayBuffer, p, confrx.VALEURS32.length);
  this.valeursInt32 = new Int32Array(this.arrayBuffer, p, confrx.VALEURS32.length);
  p += this.valeursUint32.byteLength;
  for(let i = 0; i < confrx.VALEURS32.length; i++)
   this.setFloatValeur32(i, confrx.VALEURS32[i].INIT);

  this.commandesUint16 = new Uint16Array(this.arrayBuffer, p, conftx.COMMANDES16.length);
  this.commandesInt16 = new Int16Array(this.arrayBuffer, p, conftx.COMMANDES16.length);
  p += this.commandesUint16.byteLength;
  for(let i = 0; i < conftx.COMMANDES16.length; i++)
   this.setFloatCommande16(i, conftx.COMMANDES16[i].INIT);

  this.valeursUint16 = new Uint16Array(this.arrayBuffer, p, confrx.VALEURS16.length);
  this.valeursInt16 = new Int16Array(this.arrayBuffer, p, confrx.VALEURS16.length);
  p += this.valeursUint16.byteLength;
  for(let i = 0; i < confrx.VALEURS16.length; i++)
   this.setFloatValeur16(i, confrx.VALEURS16[i].INIT);

  this.choixCameras = new Uint8Array(this.arrayBuffer, p, conftx.CHOIXCAMERAS.length);
  p += this.choixCameras.byteLength;
  for(let i = 0; i < conftx.CHOIXCAMERAS.length; i++)
   this.choixCameras[i] = conftx.CHOIXCAMERAS[i];

  this.commandesUint8 = new Uint8Array(this.arrayBuffer, p, conftx.COMMANDES8.length);
  this.commandesInt8 = new Int8Array(this.arrayBuffer, p, conftx.COMMANDES8.length);
  p += this.commandesUint8.byteLength;
  for(let i = 0; i < conftx.COMMANDES8.length; i++)
   this.setFloatCommande8(i, conftx.COMMANDES8[i].INIT);

  this.commandes1 = new Uint8Array(this.arrayBuffer, p, Math.ceil(conftx.COMMANDES1.length / 8));
  p += this.commandes1.byteLength;
  for(let i = 0; i < conftx.COMMANDES1.length; i++)
   this.setCommande1(i, conftx.COMMANDES1[i].INIT);

  this.valeursUint8 = new Uint8Array(this.arrayBuffer, p, confrx.VALEURS8.length);
  this.valeursInt8 = new Int8Array(this.arrayBuffer, p, confrx.VALEURS8.length);
  p += this.valeursUint8.byteLength;
  for(let i = 0; i < confrx.VALEURS8.length; i++)
   this.setFloatValeur8(i, confrx.VALEURS8[i].INIT);

  this.bytes = new Uint8Array(this.arrayBuffer);
 }

 update(data, success, err) {
  let i = 0;
  while(i < data.byteLength) {

   switch(this.pos) {
    case 0:
     if(data[i] == TRAME0)
      this.pos++;
     else
      err("Premier octet de la trame télémétrique invalide");
     break;

    case 1:
     if(data[i] == TRAME1R)
      this.pos++;
     else {
      this.pos = 0;
      err("Second octet de la trame télémétrique invalide");
     }
     break;

    default:
     this.bytes[this.pos++] = data[i];
     if(this.pos == this.byteLength) {
      success();
      this.pos = 0;
     }
     break;
   }

   i++;
  }
 }

 setCommande32(id, valeur) {
  if(this.conftx.COMMANDES32[id].SIGNE)
   this.commandesInt32[id] = valeur;
  else
   this.commandesUint32[id] = valeur;
 }

 setCommande16(id, valeur) {
  if(this.conftx.COMMANDES16[id].SIGNE)
   this.commandesInt16[id] = valeur;
  else
   this.commandesUint16[id] = valeur;
 }

 setCommande8(id, valeur) {
  if(this.conftx.COMMANDES8[id].SIGNE)
   this.commandesInt8[id] = valeur;
  else
   this.commandesUint8[id] = valeur;
 }

 setCommande1(id, valeur) {
  let pos = Math.trunc(id / 8);

  if(valeur)
   this.commandes1[pos] |= 1 << id % 8;
  else
   this.commandes1[pos] &= ~(1 << id % 8);
 }

 getCommande32(id) {
  let valeur;

  if(this.conftx.COMMANDES32[id].SIGNE)
   valeur = this.commandesInt32[id];
  else
   valeur = this.commandesUint32[id];

  return valeur;
 }

 getCommande16(id) {
  let valeur;

  if(this.conftx.COMMANDES16[id].SIGNE)
   valeur = this.commandesInt16[id];
  else
   valeur = this.commandesUint16[id];

  return valeur;
 }

 getCommande8(id) {
  let valeur;

  if(this.conftx.COMMANDES8[id].SIGNE)
   valeur = this.commandesInt8[id];
  else
   valeur = this.commandesUint8[id];

  return valeur;
 }

 getCommande1(id) {
  let pos = Math.trunc(id / 8);

  return this.commandes1[pos] >> id % 8 & 1;
 }

 computeRawCommande32(id, valeur) {
  let min;
  let max;

  if(this.conftx.COMMANDES32[id].SIGNE) {
   min = -2147483647;
   max = 2147483647;
  } else {
   min = 0;
   max = 4294967295;
  }
  valeur = constrain(valeur, this.conftx.COMMANDES32[id].ECHELLEMIN, this.conftx.COMMANDES32[id].ECHELLEMAX);
  valeur = mapTrunc(valeur, this.conftx.COMMANDES32[id].ECHELLEMIN, this.conftx.COMMANDES32[id].ECHELLEMAX, min, max);

  return valeur;
 }

 computeRawCommande16(id, valeur) {
  let min;
  let max;

  if(this.conftx.COMMANDES16[id].SIGNE) {
   min = -32767;
   max = 32767;
  } else {
   min = 0;
   max = 65535;
  }
  valeur = constrain(valeur, this.conftx.COMMANDES16[id].ECHELLEMIN, this.conftx.COMMANDES16[id].ECHELLEMAX);
  valeur = mapTrunc(valeur, this.conftx.COMMANDES16[id].ECHELLEMIN, this.conftx.COMMANDES16[id].ECHELLEMAX, min, max);

  return valeur;
 }

 computeRawCommande8(id, valeur) {
  let min;
  let max;

  if(this.conftx.COMMANDES8[id].SIGNE) {
   min = -127;
   max = 127;
  } else {
   min = 0;
   max = 255;
  }
  valeur = constrain(valeur, this.conftx.COMMANDES8[id].ECHELLEMIN, this.conftx.COMMANDES8[id].ECHELLEMAX);
  valeur = mapTrunc(valeur, this.conftx.COMMANDES8[id].ECHELLEMIN, this.conftx.COMMANDES8[id].ECHELLEMAX, min, max);

  return valeur;
 }

 setFloatCommande32(id, valeur) {
  valeur = this.computeRawCommande32(id, valeur);
  this.setCommande32(id, valeur);
 }

 setFloatCommande16(id, valeur) {
  valeur = this.computeRawCommande16(id, valeur);
  this.setCommande16(id, valeur);
 }

 setFloatCommande8(id, valeur) {
  valeur = this.computeRawCommande8(id, valeur);
  this.setCommande8(id, valeur);
 }

 getFloatCommande32(id) {
  let valeur;

  if(this.conftx.COMMANDES32[id].SIGNE)
   valeur = mapFloat(this.commandesInt32[id], -2147483648, 2147483648, this.conftx.COMMANDES32[id].ECHELLEMIN, this.conftx.COMMANDES32[id].ECHELLEMAX);
  else
   valeur = mapFloat(this.commandesUint32[id], 0, 4294967295, this.conftx.COMMANDES32[id].ECHELLEMIN, this.conftx.COMMANDES32[id].ECHELLEMAX);

  return valeur;
 }

 getFloatCommande16(id) {
  let valeur;

  if(this.conftx.COMMANDES16[id].SIGNE)
   valeur = mapFloat(this.commandesInt16[id], -32768, 32768, this.conftx.COMMANDES16[id].ECHELLEMIN, this.conftx.COMMANDES16[id].ECHELLEMAX);
  else
   valeur = mapFloat(this.commandesUint16[id], 0, 65535, this.conftx.COMMANDES16[id].ECHELLEMIN, this.conftx.COMMANDES16[id].ECHELLEMAX);

  return valeur;
 }

 getFloatCommande8(id) {
  let valeur;

  if(this.conftx.COMMANDES8[id].SIGNE)
   valeur = mapFloat(this.commandesInt8[id], -128, 128, this.conftx.COMMANDES8[id].ECHELLEMIN, this.conftx.COMMANDES8[id].ECHELLEMAX);
  else
   valeur = mapFloat(this.commandesUint8[id], 0, 255, this.conftx.COMMANDES8[id].ECHELLEMIN, this.conftx.COMMANDES8[id].ECHELLEMAX);

  return valeur;
 }

 getTexteCommande32(id) {
  return this.getFloatCommande32(id).toFixed(this.conftx.COMMANDES32[id].NBCHIFFRES) + this.conftx.COMMANDES32[id].UNITE;
 }

 getTexteCommande16(id) {
  return this.getFloatCommande16(id).toFixed(this.conftx.COMMANDES16[id].NBCHIFFRES) + this.conftx.COMMANDES16[id].UNITE;
 }

 getTexteCommande8(id) {
  return this.getFloatCommande8(id).toFixed(this.conftx.COMMANDES8[id].NBCHIFFRES) + this.conftx.COMMANDES8[id].UNITE;
 }

 getTexteCommande1(id) {
  if(this.getCommande1(id))
   return "On";
  else
   return "Off";
 }

 setValeur32(id, valeur) {
  if(this.confrx.VALEURS32[id].SIGNE)
   this.valeursInt32[id] = valeur;
  else
   this.valeursUint32[id] = valeur;
 }

 setValeur16(id, valeur) {
  if(this.confrx.VALEURS16[id].SIGNE)
   this.valeursInt16[id] = valeur;
  else
   this.valeursUint16[id] = valeur;
 }

 setValeur8(id, valeur) {
  if(this.confrx.VALEURS8[id].SIGNE)
   this.valeursInt8[id] = valeur;
  else
   this.valeursUint8[id] = valeur;
 }

 getValeur32(id) {
  let valeur;

  if(this.confrx.VALEURS32[id].SIGNE)
   valeur = this.valeursInt32[id];
  else
   valeur = this.valeursUint32[id];

  return valeur;
 }

 getValeur16(id) {
  let valeur;

  if(this.confrx.VALEURS16[id].SIGNE)
   valeur = this.valeursInt16[id];
  else
   valeur = this.valeursUint16[id];

  return valeur;
 }

 getValeur8(id) {
  let valeur;

  if(this.confrx.VALEURS8[id].SIGNE)
   valeur = this.valeursInt8[id];
  else
   valeur = this.valeursUint8[id];

  return valeur;
 }

 computeRawValeur32(id, valeur) {
  let min;
  let max;

  if(this.confrx.VALEURS32[id].SIGNE) {
   min = -2147483647;
   max = 2147483647;
  } else {
   min = 0;
   max = 4294967295;
  }
  valeur = constrain(valeur, this.confrx.VALEURS32[id].ECHELLEMIN, this.confrx.VALEURS32[id].ECHELLEMAX);
  valeur = mapTrunc(valeur, this.confrx.VALEURS32[id].ECHELLEMIN, this.confrx.VALEURS32[id].ECHELLEMAX, min, max);

  return valeur;
 }

 computeRawValeur16(id, valeur) {
  let min;
  let max;

  if(this.confrx.VALEURS16[id].SIGNE) {
   min = -32767;
   max = 32767;
  } else {
   min = 0;
   max = 65535;
  }
  valeur = constrain(valeur, this.confrx.VALEURS16[id].ECHELLEMIN, this.confrx.VALEURS16[id].ECHELLEMAX);
  valeur = mapTrunc(valeur, this.confrx.VALEURS16[id].ECHELLEMIN, this.confrx.VALEURS16[id].ECHELLEMAX, min, max);

  return valeur;
 }

 computeRawValeur8(id, valeur) {
  let min;
  let max;

  if(this.confrx.VALEURS8[id].SIGNE) {
   min = -127;
   max = 127;
  } else {
   min = 0;
   max = 255;
  }
  valeur = constrain(valeur, this.confrx.VALEURS8[id].ECHELLEMIN, this.confrx.VALEURS8[id].ECHELLEMAX);
  valeur = mapTrunc(valeur, this.confrx.VALEURS8[id].ECHELLEMIN, this.confrx.VALEURS8[id].ECHELLEMAX, min, max);

  return valeur;
 }

 setFloatValeur32(id, valeur) {
  valeur = this.computeRawValeur32(id, valeur);
  this.setValeur32(id, valeur);
 }

 setFloatValeur16(id, valeur) {
  valeur = this.computeRawValeur16(id, valeur);
  this.setValeur16(id, valeur);
 }

 setFloatValeur8(id, valeur) {
  valeur = this.computeRawValeur8(id, valeur);
  this.setValeur8(id, valeur);
 }

 getFloatValeur32(id) {
  let valeur;

  if(this.confrx.VALEURS32[id].SIGNE)
   valeur = mapFloat(this.valeursInt32[id], -2147483648, 2147483648, this.confrx.VALEURS32[id].ECHELLEMIN, this.confrx.VALEURS32[id].ECHELLEMAX);
  else
   valeur = mapFloat(this.valeursUint32[id], 0, 4294967295, this.confrx.VALEURS32[id].ECHELLEMIN, this.confrx.VALEURS32[id].ECHELLEMAX);

  return valeur;
 }

 getFloatValeur16(id) {
  let valeur;

  if(this.confrx.VALEURS16[id].SIGNE)
   valeur = mapFloat(this.valeursInt16[id], -32768, 32768, this.confrx.VALEURS16[id].ECHELLEMIN, this.confrx.VALEURS16[id].ECHELLEMAX);
  else
   valeur = mapFloat(this.valeursUint16[id], 0, 65535, this.confrx.VALEURS16[id].ECHELLEMIN, this.confrx.VALEURS16[id].ECHELLEMAX);

  return valeur;
 }

 getFloatValeur8(id) {
  let valeur;

  if(this.confrx.VALEURS8[id].SIGNE)
   valeur = mapFloat(this.valeursInt8[id], -128, 128, this.confrx.VALEURS8[id].ECHELLEMIN, this.confrx.VALEURS8[id].ECHELLEMAX);
  else
   valeur = mapFloat(this.valeursUint8[id], 0, 255, this.confrx.VALEURS8[id].ECHELLEMIN, this.confrx.VALEURS8[id].ECHELLEMAX);

  return valeur;
 }

 getTexteValeur32(id) {
  return this.getFloatValeur32(id).toFixed(this.confrx.VALEURS32[id].NBCHIFFRES) + this.confrx.VALEURS32[id].UNITE;
 }

 getTexteValeur16(id) {
  return this.getFloatValeur16(id).toFixed(this.confrx.VALEURS16[id].NBCHIFFRES) + this.confrx.VALEURS16[id].UNITE;
 }

 getTexteValeur8(id) {
  return this.getFloatValeur8(id).toFixed(this.confrx.VALEURS8[id].NBCHIFFRES) + this.confrx.VALEURS8[id].UNITE;
 }
}

module.exports = {Tx, Rx};
