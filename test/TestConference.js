'use strict';

const conferenceContract = artifacts.require("Conference");

contract('Conference', (accounts) => {

  const account_zero = accounts[0];
  const account_one = accounts[1];

  describe('check initial contract state', () => {
    it("should have quota `500`", () => {
      return conferenceContract.deployed()
        .then(instance => {
          return instance.quota();
        })
        .then(quota => {
          assert.equal(quota, 500, 'did not return quota `500`');
        });
    });

    it("should have numRegistrants `0`", () => {
      return conferenceContract.deployed()
        .then(instance => {
          return instance.numRegistrants();
        })
        .then(numRegistrants => {
          assert.equal(numRegistrants, 0, 'did not return numRegistrants `0`');
        });
    });

    it("should have correct organizer", () => {
      return conferenceContract.deployed()
        .then(instance => {
          return instance.organizer();
        })
        .then(organizerAccount => {
          assert.equal(organizerAccount, account_zero, 'did not return organizer ' + account_zero);
        });
    });
  });

  describe('check ticket purchase', () => {
    it("should return `true` on ticket purchase", () => {
      return conferenceContract.deployed()
        .then(instance => {
          return instance.buyTicket.call({ value: 20, from: account_one });  // using `call()` so that we can get return value. Otherwise returns Tx object
        })
        .then((returnValue) => {
          assert.equal(returnValue, true, 'did not return `true` on ticket purchase');
        });
    });

    it("should emit `Deposit` event on ticket purchase", () => {
      return conferenceContract.deployed()
        .then(instance => {
          return instance.buyTicket({ value: 20, from: account_one });
        })
        .then((transaction) => {
          assert.equal(transaction.logs[0].event, 'Deposit', 'did not emit a `Deposit` event');
        });
    });

    it("should record amount paid for ticket purchased", () => {
      return conferenceContract.deployed()
        .then(instance => {
          return instance.registrantsPaid(account_one);
        })
        .then(amountPaid => {
          assert.equal(amountPaid, 20, 'did not record ticket purchase amount correctly');
        });
    });

    it("should increment `numRegistrants`", () => {
      return conferenceContract.deployed()
        .then(instance => {
          return instance.numRegistrants.call();
        })
        .then((numRegistrants) => {
          assert.equal(numRegistrants, 1, 'did not increment `numRegistrants` after purchase');
        });
    });
  });

  describe('check quota update', () => {
    it("owner can update quota", () => {
      let contractInstance = null;
      return conferenceContract.deployed()
        .then(instance => {
          contractInstance = instance;
          return instance.changeQuota(650);
        })
        .then(transaction => contractInstance.quota.call())
        .then(quota => {
          assert.equal(quota, 650, 'did not update quota');
        });
    });
    it("others cannot update quota", () => {
      let contractInstance = null;
      return conferenceContract.deployed()
        .then(instance => {
          contractInstance = instance;
          return instance.changeQuota(700, { from: account_one });
        })
        .then(transaction => contractInstance.quota.call())
        .then(quota => {
          assert.equal(quota, 650, 'did not update quota');
        });
    });
  });

  describe('check refund', () => {
    it("others cannot refund partial amount", () => {
      let contractInstance = null;
      return conferenceContract.deployed()
        .then(instance => {
          contractInstance = instance;
          return instance.refundTicket(account_one, 10, { from: account_one });
        })
        .then(transaction => contractInstance.registrantsPaid(account_one))
        .then(amount => {
          assert.equal(amount, 20, 'should not have refunded amount');
        });
    });
    it("others cannot refund full amount", () => {
      let contractInstance = null;
      return conferenceContract.deployed()
        .then(instance => {
          contractInstance = instance;
          return instance.refundTicket(account_one, 20, { from: account_one });
        })
        .then(transaction => contractInstance.registrantsPaid(account_one))
        .then(amount => {
          assert.equal(amount, 20, 'should not have refunded amount');
        });
    });

    it("organizer cannot refund partial amount", () => {
      let contractInstance = null;
      return conferenceContract.deployed()
        .then(instance => {
          contractInstance = instance;
          return instance.refundTicket(account_one, 10);
        })
        .then(transaction => contractInstance.registrantsPaid(account_one))
        .then(amountPaid => {
          assert.equal(amountPaid, 20, 'should not have refunded partial amount');
        });
    });

    it("organizer can refund full amount", () => {
      let contractInstance = null;
      return conferenceContract.deployed()
        .then(instance => {
          contractInstance = instance;
          return instance.refundTicket(account_one, 20);
        })
        .then(transaction => contractInstance.registrantsPaid(account_one))
        .then(amountPaid => {
          assert.equal(amountPaid, 0, 'should have refunded full amount');
        });
    });
  });
});
