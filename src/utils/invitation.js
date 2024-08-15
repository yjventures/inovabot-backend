exports.generateLinkForTeamMember = (email) => {
  
  const confirmationLink = `${process.env.INVITATION_REDIRECT_URL}/first-login?email=${email}`;
  return confirmationLink;

};