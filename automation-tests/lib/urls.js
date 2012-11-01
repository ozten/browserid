// Depending on the environment variable PERSONA_ENV, we will change the
// URLS for various sites used during testing.  This lets you target
// different environments

const URLS = {
  dev: {
    "123done": 'http://dev.123done.org',
    persona: 'https://login.dev.anosrep.org',
    myfavoritebeer: 'http://dev.myfavoritebeer.org',
    eyedeeme: 'https://eyedee.me'
  },
  stage: {
    "123done": 'http://beta.123done.org',
    persona: 'https://login.anosrep.org',
    myfavoritebeer: 'http://beta.myfavoritebeer.org',
    eyedeeme: 'https://eyedee.me'
  },
  prod: {
    "123done": 'http://123done.org',
    persona: 'https://login.persona.org',
    myfavoritebeer: 'http://myfavoritebeer.org',
    eyedeeme: 'https://eyedee.me'
  }
};

var env = process.env['PERSONA_ENV'] || 'dev';

if (!URLS[env]) {
  URLS[env] = {
    "123done": 'http://'+env+'.123done.org',
    persona: 'https://'+env+'.personatest.org',
<<<<<<< HEAD
    myfavoritebeer: 'http://'+env+'myfavoritebeer.org',
=======
    myfavoritebeer: 'http://'+env+'.myfavoritebeer.org',
>>>>>>> 16b3cd1941eb92bf8a410d0a4674e403e83487d8
    eyedeeme: 'https://eyedee.me'
  };
}

module.exports = URLS[env];
