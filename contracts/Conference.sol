pragma solidity ^0.4.11;

contract Conference {
  address public organizer;
  mapping (address => uint) public registrantsPaid;
  uint public numRegistrants;
  uint public quota;

  event Deposit(address _from, uint _amount);
  event Refund(address _to, uint _amount);

  modifier onlyOrganizer() {
    if (msg .sender != organizer) {
      return;
    }
    _;
  }

  function Conference() {
    organizer = msg.sender;
    quota = 500;
    numRegistrants = 0;
  }

  function buyTicket() public payable returns (bool) {
    if (numRegistrants >= quota) {return false;}

    registrantsPaid[msg.sender] = msg.value;
    numRegistrants++;
    Deposit(msg.sender, msg.value);
    return true;
  }

  function changeQuota(uint newquota) public onlyOrganizer {
    quota = newquota;
  }

  function refundTicket(address recipient, uint amount) public onlyOrganizer {
    if (registrantsPaid[recipient] == amount) {
      address myAddress = this;
      if (myAddress.balance >= amount) {
        recipient.transfer(amount);
        registrantsPaid[recipient] = 0;
        numRegistrants--;
        Refund(recipient, amount);
      }
    }
  }

  function destroy() { // so funds not locked in contract forever
    if (msg.sender == organizer) {
      selfdestruct(organizer); // send funds to organizer
    }
  }
}