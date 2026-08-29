(function(){
  const cookieName="housingApplicationIdentities";
  const storageKey="housingApplicationIdentities";
  const windowNamePrefix="housing-application-identities:";

  function normalize(identities){
    return [...new Set((Array.isArray(identities)?identities:[])
      .map(identity=>String(identity||"").trim())
      .filter(Boolean))];
  }

  function parse(value){
    if(!value) return [];
    try{return normalize(JSON.parse(value))}catch(error){return []}
  }

  function save(identities){
    const value=JSON.stringify(normalize(identities));
    document.cookie=`${cookieName}=${encodeURIComponent(value)}; max-age=2592000; path=/; SameSite=Lax`;
    try{localStorage.setItem(storageKey,value)}catch(error){}
    try{window.name=`${windowNamePrefix}${encodeURIComponent(value)}`}catch(error){}
  }

  function load(){
    const cookie=document.cookie.split(";").map(item=>item.trim()).find(item=>item.startsWith(`${cookieName}=`));
    if(cookie){
      const identities=parse(decodeURIComponent(cookie.slice(cookieName.length+1)));
      if(identities.length) return identities;
    }
    try{
      const identities=parse(localStorage.getItem(storageKey));
      if(identities.length) return identities;
    }catch(error){}
    try{
      if(window.name.startsWith(windowNamePrefix)){
        return parse(decodeURIComponent(window.name.slice(windowNamePrefix.length)));
      }
    }catch(error){}
    return [];
  }

  window.HousingApplicationIdentityState={save,load};
})();
