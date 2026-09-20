const test = require('node:test');
const { setup } = require('./preparation-effects.test.cjs');

for (const [hit,eva,success,extra,expected] of [
    [1,.7,100,0,.3], [.85,.1,100,0,.75], [1,.2,80,0,.6],
    [1,.2,80,20,.8], [1.4,.7,100,0,.7], [0,0,100,0,0]
]) {
    test(`RIT physical hit=${hit} eva=${eva} success=${success} extra=${extra}`, () => {
        setup({speed:false,critical:false}).run(`
            $dataClasses[1].traits=[{code:22,dataId:0,value:${hit}}];
            $dataEnemies[1].traits=[{code:22,dataId:1,value:${eva}}];
            skill(900,{successRate:${success},note:'<additionalSuccessRate:${extra}>'});
            const x=action(); near(x.itemHit(b)*(1-x.itemEva(b)),${expected});
        `);
    });
}
test('RIT magical uses MEV, not attacker HIT; certain uses success only', () => {
    setup({speed:false,critical:false}).run(`
        $dataClasses[1].traits=[];
        $dataEnemies[1].traits=[{code:22,dataId:4,value:.3},{code:22,dataId:1,value:.7}];
        skill(900,{hitType:2,successRate:90,note:'<additionalSuccessRate:10>'});
        let x=action(); near(x.itemHit(b)*(1-x.itemEva(b)),.7);
        skill(901,{hitType:0,successRate:80}); x=action(901); near(x.itemHit(b),.8); near(x.itemEva(b),0);
    `);
});