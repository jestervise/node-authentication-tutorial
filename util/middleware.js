
module.exports.loginRequired = function (req,res,next){
    //if no session in cookie, redirect user to login page 
    if(!(req.session && req.session.userId)){
      return res.redirect("/login")
      }
      next()
}

module.exports.redirectToDashboardIfLogged=function(req,res,next){
    if(req.user)
        return res.redirect("/dashboard")

    next()
}